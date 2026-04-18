import {
  Categories,
  CharacteristicEventTypes,
  type CharacteristicGetCallback,
  type CharacteristicSetCallback,
  type CharacteristicValue,
  type Logging,
  type PlatformAccessory,
  type Service,
} from 'homebridge';
import { WLEDConfig } from './types';
import { getPresetLabel, PresetDefinition } from './utils/presetUtils';
import { WLEDState, WLEDWebSocket, type WLEDResponse } from './utils/wsUtils';
import { type WLEDPlatform } from './wled-platform';

export class WLED {
  private readonly log: Logging;

  private readonly hosts: string[];
  private readonly multipleHosts: boolean;

  private readonly services: Record<number, Service> = {};

  private readonly debug: boolean;

  /*  WEBSOCKET CONNECTIONS */
  private readonly websockets: Map<string, WLEDWebSocket> = new Map();

  private primaryWebSocket: WLEDWebSocket | null = null;

  private readonly state = { on: false, brightness: -1, preset: -1 };

  /*  END LOCAL CACHING VARIABLES */

  constructor(
    private readonly platform: WLEDPlatform,
    private readonly accessory: PlatformAccessory<WLEDConfig>,
    private readonly presets: Record<number, PresetDefinition>,
  ) {
    this.log = platform.log;
    this.debug = accessory.context.log ?? false;

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
    (
      this.accessory.getService(this.platform.Service.AccessoryInformation) ??
      this.accessory.addService(this.platform.Service.AccessoryInformation)
    )
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'WLED')
      .setCharacteristic(this.platform.Characteristic.Model, 'WLED Light Strip')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.hosts.join(','));

    this.services = Object.fromEntries(
      Object.entries(presets).map(([presetId, preset]) => [
        presetId,
        this.registerPresetServices(parseInt(presetId, 10), preset),
      ]),
    );
    this.accessory.services
      .filter((cached) => cached.UUID !== this.platform.Service.AccessoryInformation.UUID)
      .filter((cached) => !Object.values(this.services).some((service) => service.subtype === cached.subtype))
      .forEach((orphaned) => {
        this.log.info('Removing orphaned service from cache:', orphaned.displayName);
        this.accessory.removeService(orphaned);
      });
    this.accessory.on('identify', () => this.identify());

    this.log.info('WLED Strip finished initializing!');

    this.connectWebSockets();
  }

  async identify(): Promise<void> {
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

  private handleStateUpdate(data: WLEDResponse, sourceHost: string): void {
    try {
      const state = data.state;

      // Const info = data.info; // Unused for now

      // Update cached values
      if (state.on !== undefined) {
        this.state.on = state.on;
      }

      if (state.bri !== undefined && state.bri > 0) {
        this.state.brightness = state.bri;
      }

      // Update preset
      if (state.ps !== undefined) {
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
    if (this.debug) {
      this.log(`Sending data to all hosts: ${JSON.stringify(data)}`);
    }

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

  registerPresetServices(presetId: number, preset: PresetDefinition): Service {
    const identifier = `Preset ID=${presetId} Label=${getPresetLabel(presetId, preset)}`;

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
        if (this.debug) {
          this.log(`Current state of preset ${presetId} was returned: ${result}`);
        }

        return result;
      })
      .onSet((value: CharacteristicValue) => {
        const desiredValue = value as boolean;
        if ((desiredValue && !this.state.on) || this.state.preset !== presetId) {
          this.turnOnWLEDPreset(presetId);
          if (this.debug) {
            this.log(`Light was turned on and set to preset ${presetId}!`);
          }
        } else if (!desiredValue && this.state.on && this.state.preset === presetId) {
          this.turnOffWLED();
          if (this.debug) {
            this.log('Light was turned off!');
          }
        }

        this.state.on = desiredValue;
        this.updateLight();
      });

    service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        if (this.debug) {
          this.log('Current brightness: ' + this.state.brightness);
        }

        callback(undefined, this.currentBrightnessToPercent());
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.state.brightness = Math.round((255 / 100) * (value as number));
        this.wsSetBrightness(presetId);

        if (this.debug) {
          this.log('Set brightness to ' + value + '% ' + this.state.brightness);
        }

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
    this.services[presetId].updateCharacteristic(this.platform.Characteristic.Brightness, 100);
    this.state.on = true;
    this.state.preset = presetId;
  }

  updateLight(): void {
    this.log(`Current state: on=${this.state.on}, bri=${this.state.brightness}, preset=${this.state.preset}`);
    for (const [presetId, service] of Object.entries(this.services)) {
      const isActivePreset = this.state.preset === parseInt(presetId, 10);
      if (isActivePreset && this.state.on) {
        if (this.debug) {
          this.log(
            `Updating HomeKit state: Light is ON for preset ${presetId} with brightness ${this.state.brightness}`,
          );
        }

        service.updateCharacteristic(this.platform.Characteristic.On, true);
        service.updateCharacteristic(
          this.platform.Characteristic.Brightness,
          isActivePreset ? this.currentBrightnessToPercent() : 0,
        );
      } else {
        if (this.debug) {
          this.log(`Updating HomeKit state: Light is OFF for preset ${presetId}`);
        }

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
}
