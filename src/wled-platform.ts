import {
  type API,
  APIEvent,
  Characteristic,
  type DynamicPlatformPlugin,
  type Logging,
  type PlatformAccessory,
  type PlatformConfig,
  Service,
} from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { WLEDConfig } from './types';
import { getLatestWledVersion } from './utils/infoUtil';
import { WLED } from './wled-accessory';

export class WLEDPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  readonly accessories: Map<string, PlatformAccessory<WLEDConfig>> = new Map();

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig & { wleds: WLEDConfig[] },
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    // Verify configuration exists and is valid
    if (!config) {
      this.log.warn('No configuration provided. Plugin will not start until configured.');
      return;
    }

    // Verify wleds array exists and has entries
    if (!config.wleds || !Array.isArray(config.wleds) || config.wleds.length === 0) {
      this.log.info(
        'No WLEDs have been configured. Plugin will not start until WLED devices are added in the Homebridge UI.',
      );
      return;
    }

    // Verify at least one WLED has a valid host
    const hasValidWled = config.wleds.some(
      (wled: WLEDConfig) => wled && wled.host && (typeof wled.host === 'string' || Array.isArray(wled.host)),
    );

    if (!hasValidWled) {
      this.log.warn(
        'No valid WLED configuration found. Plugin will not start until at least one WLED device with a valid host is configured.',
      );
      return;
    }

    try {
      api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
        this.launchWLEDs().catch((error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log.error(`Error during platform launch: ${errorMessage}`);
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error registering platform event: ${errorMessage}`);
    }
  }

  configureAccessory(accessory: PlatformAccessory<WLEDConfig>) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // Add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);
  }

  private async launchWLEDs(): Promise<void> {
    if (!this.config.wleds || !Array.isArray(this.config.wleds)) {
      this.log.warn('No WLEDs configured or invalid configuration.');
      return;
    }

    const discoveredCacheUuids: string[] = [];
    const toRegister: PlatformAccessory[] = [];

    // do once so it can be shared by all accessories at the start
    const latestWledVersion = await getLatestWledVersion(this.log.error);

    for (const wled of this.config.wleds) {
      if (!wled || !wled.host) {
        this.log.warn('Skipping WLED configuration: No host or IP address configured.');
        continue;
      }

      const uuid = this.api.hap.uuid.generate(JSON.stringify(wled.host));
      discoveredCacheUuids.push(uuid);

      let accessory: PlatformAccessory<WLEDConfig>;
      if (this.accessories.has(uuid)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        accessory = this.accessories.get(uuid)!;
        accessory.context = wled;
      } else {
        accessory = new this.api.platformAccessory<WLEDConfig>(wled.name, uuid);
        accessory.context = wled;
        toRegister.push(accessory);
      }

      new WLED(this, accessory, latestWledVersion);
    }

    toRegister.forEach((a) => this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [a]));

    for (const [uuid, accessory] of this.accessories) {
      if (!discoveredCacheUuids.includes(uuid)) {
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
