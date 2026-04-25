import {
  Categories,
  CharacteristicEventTypes,
  type CharacteristicGetCallback,
  type CharacteristicSetCallback,
  type CharacteristicValue,
  type PlatformAccessory,
  type Service,
} from 'homebridge';
import semver from 'semver';
import { Logger } from './logger';
import { WLEDConfig } from './types';
import { getInfo, getLatestWledVersion } from './utils/infoUtil';
import { getPresetLabel, loadPresets, PresetDefinition } from './utils/presetUtils';
import { WLEDState, WLEDWebSocket, type WLEDResponse } from './utils/wsUtils';
import { type WLEDPlatform } from './wled-platform';

export class WLED {
  private readonly log: Logger;

  private readonly hosts: string[];
  private readonly multipleHosts: boolean;

  private readonly accessoryInfoService: Service;
  private services: Record<number, Service> = {};

  /*  WEBSOCKET CONNECTIONS */
  private readonly websockets: Map<string, WLEDWebSocket> = new Map();

  private primaryWebSocket: WLEDWebSocket | null = null;

  private readonly state = { on: false, brightness: -1, preset: -1 };

  private presets: Record<number, PresetDefinition> = {};

  constructor(
    private readonly platform: WLEDPlatform,
    private readonly accessory: PlatformAccessory<WLEDConfig>,
    latestWledVersion?: string,
  ) {
    this.log = new Logger(platform.log, accessory.context.log ?? false, accessory.displayName);

    if (accessory.context.host instanceof Array) {
      this.hosts = accessory.context.host;
      this.multipleHosts = true;
    } else {
      this.hosts = accessory.context.host.split(',').map((h) => h.trim());
      this.multipleHosts = false;
    }

    this.platform = platform;

    this.log.info(
      'Setting up Accessory ' +
        this.accessory.displayName +
        ' with Host-IP: ' +
        this.hosts +
        (this.multipleHosts ? ' Multiple WLED-Hosts configured' : ' Single WLED-Host configured'),
    );

    this.accessory.category = Categories.LIGHTBULB;

    this.accessoryInfoService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ??
      this.accessory.addService(this.platform.Service.AccessoryInformation);
    this.accessoryInfoService.setCharacteristic(this.platform.Characteristic.SerialNumber, this.hosts.join(','));

    getInfo(this.hosts[0], this.log.error)
      .then((info) => {
        this.log.info(`Fetched WLED information ${JSON.stringify(info)} from ${this.hosts[0]}`);
        this.accessoryInfoService.setCharacteristic(this.platform.Characteristic.FirmwareRevision, info.ver);
        this.accessoryInfoService.setCharacteristic(this.platform.Characteristic.Manufacturer, info.brand);
        this.accessoryInfoService.setCharacteristic(this.platform.Characteristic.Model, info.product);
      })
      .catch((e) => {
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.log.error(`Failed to fetch WLED version from ${this.hosts[0]}: ${errorMessage}`);
      });

    this.fetchAndRegisterPresets();
    if (accessory.context.presetUpdateCheckIntervalSeconds !== 0) {
      setInterval(
        () => this.fetchAndRegisterPresets(),
        (accessory.context.presetUpdateCheckIntervalSeconds ?? 30) * 1000,
      );
    }

    if (accessory.context.softwareUpdateCheckIntervalSeconds !== 0) {
      this.checkSoftwareUpdateStatus(latestWledVersion);
      const interval = (accessory.context.softwareUpdateCheckIntervalSeconds ?? 21600) * 1000;
      // random first check to prevent multiple accessories from checking for updates at the same time
      setTimeout(() => {
        this.checkSoftwareUpdateStatus();
        setInterval(() => this.checkSoftwareUpdateStatus(), interval);
      }, Math.random() * interval);
    }

    this.accessory.on('identify', () => this.identify());

    this.log.info('WLED Strip finished initializing!');

    this.connectWebSockets();
  }

  async identify(): Promise<void> {
    this.log.info(`Identifying WLED Strip ${this.accessory.displayName} by cycling through presets...`);
    for (const presetId of [...Object.keys(this.presets), 'off', ...Object.keys(this.presets)].slice(0, 5)) {
      if (presetId === 'off') {
        this.turnOffWLED();
      } else {
        this.turnOnWLEDPreset(parseInt(presetId, 10));
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.turnOffWLED();
  }

  async fetchAndRegisterPresets(): Promise<void> {
    try {
      this.presets = await loadPresets(this.hosts[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Failed to load presets for ${this.hosts[0]}: ${errorMessage}`);
      return;
    }

    const newServices = Object.fromEntries(
      Object.entries(this.presets).map(([presetId, preset]) => [
        presetId,
        this.registerPresetService(parseInt(presetId, 10), preset),
      ]),
    );
    this.services = newServices;

    this.accessory.services
      .filter((cached) => cached.UUID !== this.platform.Service.AccessoryInformation.UUID)
      .filter((cached) => !Object.values(this.services).some((service) => service.subtype === cached.subtype))
      .forEach((orphaned) => {
        this.log.info('Removing orphaned service from cache:', orphaned.displayName);
        this.accessory.removeService(orphaned);
      });
  }

  private connectWebSockets(): void {
    try {
      // Connect to primary host first
      const primaryHost = this.hosts[0];
      if (!primaryHost) {
        this.log.error('No primary host configured for WebSocket connection');
        return;
      }

      this.primaryWebSocket = new WLEDWebSocket(primaryHost);

      this.primaryWebSocket.setOnStateUpdate((data: WLEDResponse) => {
        this.handleStateUpdate(data, primaryHost);
      });

      this.primaryWebSocket.setOnError((error: Error) => {
        this.log.error(`WebSocket error for ${primaryHost}: ${error.message}`);
      });

      this.primaryWebSocket.setOnConnect(() => {
        try {
          this.log.info(`WebSocket connected to ${primaryHost}`);

          // Request initial state
          this.primaryWebSocket?.requestState();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log.error(`Error in WebSocket connect callback for ${primaryHost}: ${errorMessage}`);
        }
      });

      this.primaryWebSocket.setOnDisconnect(() => {
        this.log.warn(`WebSocket disconnected from ${primaryHost}`);
      });

      this.websockets.set(primaryHost, this.primaryWebSocket);
      this.primaryWebSocket.connect().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log.error(`Failed to connect WebSocket to ${primaryHost}: ${errorMessage}`);
      });

      // Connect to additional hosts if multiple hosts configured
      if (this.multipleHosts && this.hosts.length > 1) {
        for (let i = 1; i < this.hosts.length; i++) {
          try {
            const host = this.hosts[i];
            if (host) {
              const ws = new WLEDWebSocket(host);

              ws.setOnError((error: Error) => {
                this.log.error(`WebSocket error for ${host}: ${error.message}`);
              });

              ws.setOnConnect(() => {
                this.log.info(`WebSocket connected to ${host}`);
                this.checkSoftwareUpdateStatus();
              });

              ws.setOnDisconnect(() => {
                this.log.warn(`WebSocket disconnected from ${host}`);
              });

              this.websockets.set(host, ws);
              ws.connect().catch((error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log.error(`Failed to connect WebSocket to ${host}: ${errorMessage}`);
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error setting up WebSocket for host at index ${i}: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error in connectWebSockets: ${errorMessage}`);
    }
  }

  private handleStateUpdate({ state }: WLEDResponse, sourceHost: string): void {
    try {
      this.log.info(`Received state update from ${sourceHost}: on=${state.on}, bri=${state.bri}, ps=${state.ps}`);

      // Update cached values
      if (state.on !== undefined) {
        this.state.on = state.on;
      }

      if (state.bri !== undefined && state.bri > 0) {
        this.state.brightness = state.bri;
      }

      // Update preset (ignoring -1, to retain control of custom setups via home app)
      if (state.ps !== undefined && state.ps !== -1) {
        this.state.preset = state.ps;
      }

      // Sync to other hosts if multiple hosts configured
      if (this.multipleHosts && sourceHost === this.hosts[0]) {
        this.syncToOtherHosts(state);
      }

      // Update HomeKit characteristics
      this.updateLight();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error handling state update from ${sourceHost}: ${errorMessage}`);
    }
  }

  private syncToOtherHosts(state: WLEDState): void {
    try {
      // Only sync if this update came from the primary host
      for (let i = 1; i < this.hosts.length; i++) {
        const host = this.hosts[i];
        const ws = this.websockets.get(host);
        if (ws && ws.getConnected()) {
          // Send state update to other hosts
          ws.send(state);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error syncing to other hosts: ${errorMessage}`);
    }
  }

  private sendToAllHosts(data: WLEDState): void {
    this.log.info(`Sending data to all hosts: ${JSON.stringify(data)}`);

    try {
      this.websockets.forEach((ws, host) => {
        try {
          if (ws.getConnected()) {
            ws.send(data);
          } else {
            this.log.warn(`WebSocket not connected to ${host}, skipping update`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log.error(`Error sending to ${host}: ${errorMessage}`);
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error in sendToAllHosts: ${errorMessage}`);
    }
  }

  registerPresetService(presetId: number, preset: PresetDefinition): Service {
    const identifier = `Preset ID=${presetId} Label=${getPresetLabel(presetId, preset)}`;

    if (this.services[presetId]) {
      return this.services[presetId];
    }

    const service =
      this.accessory.getServiceById(this.platform.Service.Lightbulb, identifier) ??
      this.accessory.addService(new this.platform.Service.Lightbulb(getPresetLabel(presetId, preset), identifier));

    service.setCharacteristic(this.platform.Characteristic.Name, getPresetLabel(presetId, preset));
    if (!service.getCharacteristic(this.platform.Characteristic.ConfiguredName)) {
      service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
    }
    service.getCharacteristic(this.platform.Characteristic.ConfiguredName).setValue(getPresetLabel(presetId, preset));

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => {
        const result = this.state.preset === presetId && this.state.on;

        this.log.info(`Current state of preset ${presetId}'s ON was requested and returned: ${result}`);

        return result;
      })
      .onSet((value: CharacteristicValue) => {
        const desiredValue = value as boolean;

        this.log.info(
          `Received request to set preset ${presetId} to ${desiredValue ? 'ON' : 'OFF'}; current state is ${this.state.on ? 'ON' : 'OFF'} and ${this.state.preset === presetId ? `preset ${presetId}` : `preset ${this.state.preset}`}`,
        );

        // if requesting to turn preset off that is already off, do nothing
        if (desiredValue === false && (this.state.on === false || this.state.preset !== presetId)) {
          this.log.info(`Preset ${presetId} is already off; ignoring request to turn off.`);
          return;
        }
        // if requesting to turn preset on that is already on, do nothing
        if (desiredValue === true && this.state.on === true && this.state.preset === presetId) {
          this.log.info(`Preset ${presetId} is already on; ignoring request to turn on.`);
          return;
        }

        // if turning on a preset that is currently off
        if (desiredValue) {
          this.turnOnWLEDPreset(presetId);

          this.log.info(`Light was turned on and set to preset ${presetId}!`);
        }
        // if turning off a preset that is currently on
        else {
          this.turnOffWLED();

          this.log.info('Light was turned off!');
        }

        this.state.on = desiredValue;
        this.updateLight();
      });

    service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info(`Current preset ${presetId}'s brightness: ${this.state.brightness}`);

        callback(undefined, this.currentBrightnessToPercent());
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.state.brightness = Math.round((255 / 100) * (value as number));
        this.wsSetBrightness(presetId);

        this.log.info(`Set preset ${presetId}'s brightness to ${value}% (${this.state.brightness})`);

        callback();
        this.updateLight();
      });

    return service;
  }

  wsSetBrightness(presetId: number): void {
    if (this.state.brightness === 0) {
      this.turnOffWLED();
      return;
    }

    this.sendToAllHosts({
      bri: this.state.brightness,
      ps: presetId,
    });
  }

  turnOffWLED(): void {
    this.sendToAllHosts({
      on: false,
    });
    this.state.on = false;
  }

  turnOnWLEDPreset(presetId: number): void {
    this.sendToAllHosts({
      on: true,
      ps: presetId,
      bri: this.presets[presetId]?.bri,
    });
    this.state.on = true;
    this.state.brightness = this.presets[presetId]?.bri ?? this.state.brightness;
    this.state.preset = presetId;
    this.services[presetId].updateCharacteristic(
      this.platform.Characteristic.Brightness,
      this.currentBrightnessToPercent(),
    );
  }

  updateLight(): void {
    this.log.info(`Current state: on=${this.state.on}, bri=${this.state.brightness}, preset=${this.state.preset}`);
    for (const [presetId, service] of Object.entries(this.services)) {
      const isActivePreset = this.state.preset === parseInt(presetId, 10);
      if (isActivePreset && this.state.on && this.state.brightness > 0) {
        this.log.info(
          `Updating HomeKit state: Light is ON for preset ${presetId} with brightness ${this.state.brightness}`,
        );

        service.updateCharacteristic(this.platform.Characteristic.On, true);
        service.updateCharacteristic(
          this.platform.Characteristic.Brightness,
          isActivePreset ? this.currentBrightnessToPercent() : 0,
        );
      } else {
        this.log.info(`Updating HomeKit state: Light is OFF for preset ${presetId}`);

        service.updateCharacteristic(this.platform.Characteristic.On, false);
        service.updateCharacteristic(this.platform.Characteristic.Brightness, 0);
      }
    }
  }

  currentBrightnessToPercent(): number {
    if (this.state.brightness <= 0) {
      return 0;
    }

    return Math.round((this.state.brightness / 255) * 100);
  }

  disconnect(): void {
    this.websockets.forEach((ws) => {
      ws.disconnect();
    });
    this.websockets.clear();
    this.primaryWebSocket = null;
  }

  async checkSoftwareUpdateStatus(latestWledVersion?: string) {
    if (!latestWledVersion) {
      latestWledVersion = await getLatestWledVersion((s) => this.log.error(s));
    }
    if (!latestWledVersion) {
      this.log.error('Could not fetch latest WLED version for update check');
      return;
    }

    const currentVersions = await Promise.all(
      this.hosts.map((host) => getInfo(host, (s) => this.log.error(s)).then((info) => info.ver)),
    );

    for (let i = 0; i < this.hosts.length; i++) {
      const host = this.hosts[i];
      const currentVersion = currentVersions[i];

      if (semver.lt(semver.coerce(currentVersion) ?? latestWledVersion, latestWledVersion)) {
        this.log.warn(
          `A new WLED version ${latestWledVersion} is available for host ${this.hosts[i]} (currently running version ${currentVersion}).`,
        );
      } else {
        this.log.info(`WLED version ${currentVersion} for host ${host} is up to date (latest=${latestWledVersion})!`);
      }
    }

    // TODO: report this as a proper FirmwareUpdate accessory, however, I cannot determine the proper characteristic values...
  }
}
