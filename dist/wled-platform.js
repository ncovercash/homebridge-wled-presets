"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLEDPlatform = void 0;
const wled_accessory_1 = require("./wled-accessory");
const wsUtils_1 = require("./utils/wsUtils");
class WLEDPlatform {
    accessories = [];
    log;
    api;
    config;
    wleds = [];
    constructor(log, config, api) {
        this.api = api;
        this.config = config;
        this.log = log;
        // Verify configuration exists and is valid
        if (!config) {
            this.log.warn('No configuration provided. Plugin will not start until configured.');
            return;
        }
        // Verify wleds array exists and has entries
        if (!config.wleds || !Array.isArray(config.wleds) || config.wleds.length === 0) {
            this.log.info('No WLEDs have been configured. Plugin will not start until WLED devices are added in the Homebridge UI.');
            return;
        }
        // Verify at least one WLED has a valid host
        const hasValidWled = config.wleds.some((wled) => wled && wled.host && (typeof wled.host === 'string' || Array.isArray(wled.host)));
        if (!hasValidWled) {
            this.log.warn('No valid WLED configuration found. Plugin will not start until at least one WLED device with a valid host is configured.');
            return;
        }
        try {
            api.on("didFinishLaunching" /* APIEvent.DID_FINISH_LAUNCHING */, () => {
                try {
                    this.launchWLEDs();
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.log.error(`Error during platform launch: ${errorMessage}`);
                }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error registering platform event: ${errorMessage}`);
        }
    }
    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }
    launchWLEDs() {
        if (!this.config.wleds || !Array.isArray(this.config.wleds)) {
            this.log.warn('No WLEDs configured or invalid configuration.');
            return;
        }
        for (const wled of this.config.wleds) {
            try {
                if (!wled || !wled.host) {
                    this.log.warn('Skipping WLED configuration: No host or IP address configured.');
                    continue;
                }
                // Determine primary host for effect loading
                const primaryHost = Array.isArray(wled.host) ? wled.host[0] : wled.host;
                (0, wsUtils_1.loadEffectsViaHTTP)(primaryHost)
                    .then(effects => {
                    try {
                        this.wleds.push(new wled_accessory_1.WLED(this, wled, effects));
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.log.error(`Failed to create WLED instance for ${primaryHost}: ${errorMessage}`);
                    }
                })
                    .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.log.error(`Error loading effects for ${primaryHost}: ${errorMessage}`);
                    // Still create WLED instance with empty effects array as fallback
                    try {
                        this.wleds.push(new wled_accessory_1.WLED(this, wled, []));
                    }
                    catch (createError) {
                        const createErrorMessage = createError instanceof Error ? createError.message : String(createError);
                        this.log.error(`Failed to create WLED instance with fallback for ${primaryHost}: ${createErrorMessage}`);
                    }
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log.error(`Unexpected error processing WLED configuration: ${errorMessage}`);
            }
        }
    }
}
exports.WLEDPlatform = WLEDPlatform;
//# sourceMappingURL=wled-platform.js.map