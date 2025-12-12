"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLED = void 0;
const settings_1 = require("./settings");
const wsUtils_1 = require("./utils/wsUtils");
const colorUtils_1 = require("./utils/colorUtils");
class WLED {
    log;
    hap;
    api;
    platform;
    Characteristic;
    wledAccessory;
    name;
    host;
    lightService;
    ambilightService;
    speedService;
    effectsService;
    presetsService;
    /*        LOGGING / DEBUGGING         */
    debug = false;
    prodLogging = false;
    /*       END LOGGING / DEBUGGING      */
    multipleHosts;
    disableEffectSwitch;
    disablePresetSwitch;
    turnOffWledWithEffect;
    showEffectControl;
    ambilightSwitch;
    /*  WEBSOCKET CONNECTIONS */
    websockets = new Map();
    primaryWebSocket = null;
    /*  LOCAL CACHING VARIABLES */
    isOffline = false;
    lightOn = false;
    ambilightOn = false;
    brightness = -1;
    hue = 100;
    saturation = 100;
    colorArray = [255, 0, 0];
    preset = -1;
    effectSpeed = 15;
    effectsAreActive = false;
    cachedAllEffects = [];
    effects = [];
    lastPlayedEffect = 0;
    presetsAreActive = false;
    presets = [];
    lastPlayedPreset = 0;
    userInitiatedColorChange = false;
    /*  END LOCAL CACHING VARIABLES */
    constructor(platform, wledConfig, loadedEffects) {
        this.log = platform.log;
        this.name = wledConfig.name || 'WLED';
        this.prodLogging = wledConfig.log || false;
        this.disableEffectSwitch = !(wledConfig.effects);
        this.disablePresetSwitch = !(wledConfig.presets);
        this.turnOffWledWithEffect = wledConfig.turnOffWledWithEffect || false;
        this.effectSpeed = wledConfig.defaultEffectSpeed || 15;
        this.showEffectControl = Boolean(wledConfig.showEffectControl);
        this.ambilightSwitch = Boolean(wledConfig.ambilightSwitch);
        this.cachedAllEffects = loadedEffects;
        if (wledConfig.host instanceof Array && wledConfig.host.length > 1) {
            this.host = wledConfig.host;
            this.multipleHosts = true;
        }
        else {
            this.host = [wledConfig.host];
            this.multipleHosts = false;
        }
        this.platform = platform;
        this.api = platform.api;
        this.hap = this.api.hap;
        this.Characteristic = this.api.hap.Characteristic;
        const uuid = this.api.hap.uuid.generate('homebridge:wled' + this.name);
        const foundAccessory = this.platform.accessories.find((x) => x.UUID === uuid);
        if (foundAccessory === undefined) {
            // eslint-disable-next-line new-cap
            this.wledAccessory = new this.api.platformAccessory(this.name, uuid);
        }
        else {
            this.wledAccessory = foundAccessory;
        }
        this.log.info('Setting up Accessory ' + this.name + ' with Host-IP: ' + this.host + ((this.multipleHosts) ? ' Multiple WLED-Hosts configured' : ' Single WLED-Host configured'));
        this.wledAccessory.category = 5 /* this.api.hap.Categories.LIGHTBULB */;
        this.lightService = this.wledAccessory.addService(this.api.hap.Service.Lightbulb, this.name, 'LIGHT');
        if (this.showEffectControl) {
            this.speedService = this.wledAccessory.addService(this.api.hap.Service.Lightbulb, 'Effect Speed', 'SPEED');
            this.lightService.addLinkedService(this.speedService);
        }
        if (this.ambilightSwitch) {
            this.ambilightService = this.wledAccessory.addService(this.api.hap.Service.Lightbulb, 'Ambilight', 'AMBI');
            this.lightService.addLinkedService(this.ambilightService);
            this.registerCharacteristicAmbilightOnOff();
        }
        this.registerCharacteristicOnOff();
        this.registerCharacteristicBrightness();
        this.registerCharacteristicSaturation();
        this.registerCharacteristicHue();
        if (!this.disableEffectSwitch) {
            // LOAD ALL EFFECTS FROM HOST
            this.effectsService = this.wledAccessory.addService(this.api.hap.Service.Television);
            this.effectsService.setCharacteristic(this.Characteristic.ConfiguredName, 'Effects');
            this.registerCharacteristicEffectsActive();
            this.registerCharacteristicEffectsActiveIdentifier();
            this.addEffectsInputSources(wledConfig.effects);
        }
        if (!this.disablePresetSwitch) {
            // LOAD ALL PRESETS FROM HOST
            this.presetsService = this.wledAccessory.addService(this.api.hap.Service.Television);
            this.presetsService.setCharacteristic(this.Characteristic.ConfiguredName, 'Presets');
            this.registerCharacteristicPresetsActive();
            this.registerCharacteristicPresetsActiveIdentifier();
            this.addPresetsInputSources(wledConfig.presets);
        }
        if (!this.disableEffectSwitch && !this.disablePresetSwitch) {
            this.log.error('You are Unable to have Effects and Presets Enabled at the Same Time! Please Disable one of them.');
        }
        this.api.publishExternalAccessories(settings_1.PLUGIN_NAME, [this.wledAccessory]);
        this.platform.accessories.push(this.wledAccessory);
        this.api.updatePlatformAccessories([this.wledAccessory]);
        this.log.info('WLED Strip finished initializing!');
        this.connectWebSockets();
    }
    connectWebSockets() {
        try {
            // Connect to primary host first
            const primaryHost = this.host[0];
            if (!primaryHost) {
                this.log.error('No primary host configured for WebSocket connection');
                return;
            }
            this.primaryWebSocket = new wsUtils_1.WLEDWebSocket(primaryHost);
            this.primaryWebSocket.setOnStateUpdate((data) => {
                this.handleStateUpdate(data, primaryHost);
            });
            this.primaryWebSocket.setOnError((error) => {
                this.log.error(`WebSocket error for ${primaryHost}: ${error.message}`);
                this.isOffline = true;
            });
            this.primaryWebSocket.setOnConnect(() => {
                try {
                    this.log.info(`WebSocket connected to ${primaryHost}`);
                    this.isOffline = false;
                    // Request initial state
                    this.primaryWebSocket?.requestState();
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.log.error(`Error in WebSocket connect callback for ${primaryHost}: ${errorMessage}`);
                }
            });
            this.primaryWebSocket.setOnDisconnect(() => {
                this.log.warn(`WebSocket disconnected from ${primaryHost}`);
                this.isOffline = true;
            });
            this.websockets.set(primaryHost, this.primaryWebSocket);
            this.primaryWebSocket.connect().catch(error => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.log.error(`Failed to connect WebSocket to ${primaryHost}: ${errorMessage}`);
            });
            // Connect to additional hosts if multiple hosts configured
            if (this.multipleHosts && this.host.length > 1) {
                for (let i = 1; i < this.host.length; i++) {
                    try {
                        const host = this.host[i];
                        if (host) {
                            const ws = new wsUtils_1.WLEDWebSocket(host);
                            ws.setOnError((error) => {
                                this.log.error(`WebSocket error for ${host}: ${error.message}`);
                            });
                            ws.setOnConnect(() => {
                                this.log.info(`WebSocket connected to ${host}`);
                            });
                            ws.setOnDisconnect(() => {
                                this.log.warn(`WebSocket disconnected from ${host}`);
                            });
                            this.websockets.set(host, ws);
                            ws.connect().catch(error => {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                this.log.error(`Failed to connect WebSocket to ${host}: ${errorMessage}`);
                            });
                        }
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.log.error(`Error setting up WebSocket for host at index ${i}: ${errorMessage}`);
                    }
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error in connectWebSockets: ${errorMessage}`);
        }
    }
    handleStateUpdate(data, sourceHost) {
        try {
            const state = data.state;
            // Const info = data.info; // Unused for now
            // Update cached values
            if (state.on !== undefined) {
                this.lightOn = state.on;
            }
            if (state.bri !== undefined && state.bri > 0) {
                this.brightness = state.bri;
            }
            // Update color from first segment
            // Only update if not a user-initiated change to prevent color picker from jumping
            if (!this.userInitiatedColorChange && state.seg && state.seg.length > 0 && state.seg[0].col && state.seg[0].col.length > 0) {
                const colorResponse = state.seg[0].col[0];
                const rgbColor = [colorResponse[0], colorResponse[1], colorResponse[2]];
                if (!this.colorArraysEqual(rgbColor, this.colorArray)) {
                    this.saveColorArrayAsHSV(rgbColor);
                    this.colorArray = rgbColor;
                }
            }
            // Update preset
            if (state.ps !== undefined) {
                this.preset = state.ps;
            }
            // Update ambilight state
            if (state.lor !== undefined) {
                this.ambilightOn = !state.lor;
            }
            // Update effect speed if available
            if (state.seg && state.seg.length > 0 && state.seg[0].sx !== undefined) {
                this.effectSpeed = state.seg[0].sx;
            }
            // Sync to other hosts if multiple hosts configured
            if (this.multipleHosts && sourceHost === this.host[0]) {
                this.syncToOtherHosts(state);
            }
            // Update HomeKit characteristics
            this.updateLight();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error handling state update from ${sourceHost}: ${errorMessage}`);
        }
    }
    syncToOtherHosts(state) {
        try {
            // Only sync if this update came from the primary host
            for (let i = 1; i < this.host.length; i++) {
                const host = this.host[i];
                const ws = this.websockets.get(host);
                if (ws && ws.getConnected()) {
                    // Send state update to other hosts
                    ws.send(state);
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error syncing to other hosts: ${errorMessage}`);
        }
    }
    sendToAllHosts(data) {
        try {
            this.websockets.forEach((ws, host) => {
                try {
                    if (ws.getConnected()) {
                        ws.send(data);
                    }
                    else {
                        this.log.warn(`WebSocket not connected to ${host}, skipping update`);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.log.error(`Error sending to ${host}: ${errorMessage}`);
                }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log.error(`Error in sendToAllHosts: ${errorMessage}`);
        }
    }
    registerCharacteristicOnOff() {
        this.lightService.getCharacteristic(this.hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            if (this.debug) {
                this.log('Current state of the switch was returned: ' + (this.lightOn ? 'ON' : 'OFF'));
            }
            callback(undefined, this.lightOn);
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            const tempLightOn = value;
            if (tempLightOn && !this.lightOn) {
                this.turnOnWLED();
                if (this.debug) {
                    this.log('Light was turned on!');
                }
            }
            else if (!tempLightOn && this.lightOn) {
                this.turnOffWLED();
                if (this.debug) {
                    this.log('Light was turned off!');
                }
            }
            this.lightOn = tempLightOn;
            callback();
        });
    }
    registerCharacteristicAmbilightOnOff() {
        this.ambilightService.getCharacteristic(this.hap.Characteristic.On)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            if (this.debug) {
                this.log('Current state of the switch was returned: ' + (this.ambilightOn ? 'ON' : 'OFF'));
            }
            callback(undefined, this.ambilightOn);
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.ambilightOn = value;
            if (this.ambilightOn) {
                this.turnOnAmbilight();
            }
            else {
                this.turnOffAmbilight();
            }
            if (this.debug) {
                this.log('Switch state was set to: ' + (this.ambilightOn ? 'ON' : 'OFF'));
            }
            callback();
        });
    }
    registerCharacteristicBrightness() {
        this.lightService.getCharacteristic(this.hap.Characteristic.Brightness)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            if (this.debug) {
                this.log('Current brightness: ' + this.brightness);
            }
            callback(undefined, this.currentBrightnessToPercent());
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.brightness = Math.round(255 / 100 * value);
            this.wsSetBrightness();
            if (this.prodLogging) {
                this.log('Set brightness to ' + value + '% ' + this.brightness);
            }
            callback();
        });
        if (this.showEffectControl) {
            // EFFECT SPEED
            this.speedService.getCharacteristic(this.hap.Characteristic.Brightness)
                .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
                callback(undefined, Math.round(this.effectSpeed / 2.55));
            }).on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
                this.effectSpeed = value;
                this.effectSpeed = Math.round(this.effectSpeed * 2.55);
                if (this.prodLogging) {
                    this.log('Speed set to ' + this.effectSpeed);
                }
                this.effectsService.setCharacteristic(this.Characteristic.ActiveIdentifier, this.lastPlayedEffect);
                callback();
            });
        }
    }
    registerCharacteristicHue() {
        this.lightService.getCharacteristic(this.hap.Characteristic.Hue)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            // eslint-disable-next-line new-cap
            const colorArray = (0, colorUtils_1.HSVtoRGB)(this.hue, this.saturation);
            this.colorArray = colorArray;
            if (this.debug) {
                this.log('Current hue: ' + this.hue + '%');
            }
            callback(undefined, this.hue);
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.userInitiatedColorChange = true;
            this.hue = value;
            this.turnOffAllEffects();
            // eslint-disable-next-line new-cap
            const colorArray = (0, colorUtils_1.HSVtoRGB)(this.hue, this.saturation);
            this.sendToAllHosts({
                bri: this.brightness,
                seg: [{
                        col: [[colorArray[0], colorArray[1], colorArray[2], 0]]
                    }]
            });
            if (this.prodLogging) {
                this.log('Changed color to ' + colorArray + ' on all hosts');
            }
            this.colorArray = colorArray;
            // Reset flag after a short delay to allow state update to be processed
            setTimeout(() => {
                this.userInitiatedColorChange = false;
            }, 500);
            callback();
        });
    }
    registerCharacteristicSaturation() {
        this.lightService.getCharacteristic(this.hap.Characteristic.Saturation)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            if (this.debug) {
                this.log('Current saturation: ' + this.saturation + '%');
            }
            callback(undefined, this.saturation);
        })
            .on("set" /* CharacteristicEventTypes.SET */, (value, callback) => {
            this.userInitiatedColorChange = true;
            this.saturation = value;
            this.turnOffAllEffects();
            // Update color with new saturation
            // eslint-disable-next-line new-cap
            const colorArray = (0, colorUtils_1.HSVtoRGB)(this.hue, this.saturation);
            this.sendToAllHosts({
                bri: this.brightness,
                seg: [{
                        col: [[colorArray[0], colorArray[1], colorArray[2], 0]]
                    }]
            });
            this.colorArray = colorArray;
            // Reset flag after a short delay to allow state update to be processed
            setTimeout(() => {
                this.userInitiatedColorChange = false;
            }, 500);
            callback();
        });
    }
    registerCharacteristicEffectsActive() {
        this.effectsService.getCharacteristic(this.Characteristic.Active)
            .on("set" /* CharacteristicEventTypes.SET */, (newValue, callback) => {
            if (newValue === 0) {
                if (this.turnOffWledWithEffect) {
                    this.turnOffWLED();
                }
                else {
                    this.turnOffAllEffects();
                }
                this.effectsAreActive = false;
            }
            else {
                if (this.turnOffWledWithEffect) {
                    this.turnOnWLED();
                }
                this.effectsAreActive = true;
                this.effectsService.setCharacteristic(this.Characteristic.ActiveIdentifier, this.lastPlayedEffect);
            }
            this.effectsService.updateCharacteristic(this.Characteristic.Active, newValue);
            callback(null);
        });
    }
    registerCharacteristicEffectsActiveIdentifier() {
        this.effectsService.getCharacteristic(this.Characteristic.ActiveIdentifier)
            .on("set" /* CharacteristicEventTypes.SET */, (newValue, callback) => {
            if (this.effectsAreActive) {
                const effectID = this.effects[parseInt(newValue.toString(), 10)];
                this.sendToAllHosts({
                    seg: [{
                            fx: effectID,
                            sx: this.effectSpeed
                        }]
                });
                if (this.prodLogging) {
                    this.log('Turned on ' + newValue + ' effect!');
                }
                this.lastPlayedEffect = parseInt(newValue.toString(), 10);
            }
            callback(null);
        });
    }
    registerCharacteristicPresetsActive() {
        this.presetsService.getCharacteristic(this.Characteristic.Active)
            .on("set" /* CharacteristicEventTypes.SET */, (newValue, callback) => {
            if (newValue === 0) {
                this.turnOffAllPresets();
                this.presetsAreActive = false;
            }
            else {
                this.turnOnWLED();
                this.presetsAreActive = true;
                this.presetsService.setCharacteristic(this.Characteristic.ActiveIdentifier, this.lastPlayedPreset);
            }
            this.presetsService.updateCharacteristic(this.Characteristic.Active, newValue);
            callback(null);
        });
    }
    registerCharacteristicPresetsActiveIdentifier() {
        this.presetsService.getCharacteristic(this.Characteristic.ActiveIdentifier)
            .on("set" /* CharacteristicEventTypes.SET */, (newValue, callback) => {
            if (this.presetsAreActive) {
                const presetID = this.presets[parseInt(newValue.toString(), 10)];
                this.sendToAllHosts({
                    ps: presetID + 1
                });
                if (this.prodLogging) {
                    this.log('Switched to ' + newValue + ' preset!');
                }
                this.lastPlayedPreset = parseInt(newValue.toString(), 10);
            }
            callback(null);
        });
    }
    addEffectsInputSources(effects) {
        if (this.prodLogging) {
            this.log('Adding effects: ' + effects);
        }
        effects.forEach((effectName, i) => {
            const effectID = this.getEffectIdByName(effectName);
            this.effects.push(effectID);
            const effectInputSource = this.wledAccessory.addService(this.hap.Service.InputSource, String(effectID), effectName);
            effectInputSource
                .setCharacteristic(this.Characteristic.Identifier, i)
                .setCharacteristic(this.Characteristic.ConfiguredName, effectName)
                .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
            this.effectsService.addLinkedService(effectInputSource);
        });
    }
    addPresetsInputSources(presets) {
        if (this.prodLogging) {
            this.log('Adding presets: ' + presets);
        }
        presets.forEach((presetName, i) => {
            const presetID = i;
            this.presets.push(presetID);
            const presetInputSource = this.wledAccessory.addService(this.hap.Service.InputSource, String(presetID), presetName);
            presetInputSource
                .setCharacteristic(this.Characteristic.Identifier, presetID)
                .setCharacteristic(this.Characteristic.ConfiguredName, presetName)
                .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
            this.presetsService.addLinkedService(presetInputSource);
        });
    }
    wsSetBrightness() {
        if (this.brightness === 0) {
            this.turnOffWLED();
            return;
        }
        const colorArray = (0, colorUtils_1.HSVtoRGB)(this.hue, this.saturation); // eslint-disable-line new-cap
        this.colorArray = colorArray;
        if (this.debug) {
            this.log('COLOR ARRAY BRIGHTNESS: ' + colorArray);
        }
        this.sendToAllHosts({
            bri: this.brightness
        });
    }
    turnOffWLED() {
        this.sendToAllHosts({
            on: false
        });
        this.lightOn = false;
    }
    turnOnWLED() {
        this.sendToAllHosts({
            on: true
        });
        this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, 100);
        this.lightOn = true;
    }
    turnOffAmbilight() {
        this.sendToAllHosts({
            lor: 1
        });
        this.ambilightOn = false;
    }
    turnOnAmbilight() {
        this.sendToAllHosts({
            lor: 0
        });
        this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, 100);
        this.ambilightOn = true;
    }
    turnOffAllEffects() {
        const colorArray = (0, colorUtils_1.HSVtoRGB)(this.hue, this.saturation); // eslint-disable-line new-cap
        this.sendToAllHosts({
            seg: [{
                    fx: 0,
                    sx: 0,
                    col: [[colorArray[0], colorArray[1], colorArray[2], 0]]
                }]
        });
        if (!this.disableEffectSwitch) {
            this.effectsService.updateCharacteristic(this.Characteristic.Active, 0);
        }
        if (this.debug) {
            this.log('Turned off Effects!');
        }
    }
    turnOffAllPresets() {
        this.sendToAllHosts({
            ps: -1
        });
        if (!this.disableEffectSwitch) {
            this.effectsService.updateCharacteristic(this.Characteristic.Active, 0);
        }
        if (this.debug) {
            this.log('Cleared Presets!');
        }
    }
    getEffectIdByName(name) {
        const allEffects = this.getAllEffects();
        const effectNr = allEffects.indexOf(name);
        if (effectNr >= 0) {
            return effectNr;
        }
        // Effect not found in device's supported effects
        // Log a warning but still try to use it (might be a newer/older version or custom effect)
        this.log.warn(`Effect "${name}" not found in WLED device's supported effects list. ` +
            'This might be a custom effect or from a different WLED version. ' +
            `Available effects: ${allEffects.length > 0 ? allEffects.slice(0, 10).join(', ') + (allEffects.length > 10 ? '...' : '') : 'none loaded'}. ` +
            'Falling back to \'Rainbow Runner\'.');
        // Try to find Rainbow Runner as fallback
        const fallbackIndex = allEffects.indexOf('Rainbow Runner');
        if (fallbackIndex >= 0) {
            return fallbackIndex;
        }
        // If Rainbow Runner is also not available, use first effect or 0
        if (allEffects.length > 0) {
            this.log.warn(`Fallback effect "Rainbow Runner" also not found. Using first available effect: "${allEffects[0]}"`);
            return 0;
        }
        // No effects available at all
        this.log.error('No effects available from WLED device. Cannot set effect.');
        return 0;
    }
    getAllEffects() {
        return this.cachedAllEffects;
    }
    updateLight() {
        this.lightService.updateCharacteristic(this.hap.Characteristic.On, this.lightOn);
        this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, this.currentBrightnessToPercent());
        this.lightService.updateCharacteristic(this.hap.Characteristic.Saturation, this.saturation);
        this.lightService.updateCharacteristic(this.hap.Characteristic.Hue, this.hue);
        if (this.ambilightService) {
            this.ambilightService.updateCharacteristic(this.hap.Characteristic.On, this.ambilightOn);
        }
        if (this.presetsService) {
            if (this.preset === -1) {
                this.presetsService.updateCharacteristic(this.Characteristic.Active, false);
            }
            else {
                this.presetsService.updateCharacteristic(this.Characteristic.Active, true);
            }
        }
    }
    currentBrightnessToPercent() {
        if (this.brightness <= 0) {
            return 0;
        }
        return Math.round((this.brightness / 255) * 100);
    }
    saveColorArrayAsHSV(colorArray) {
        const hsvArray = (0, colorUtils_1.RGBtoHSV)(colorArray[0], colorArray[1], colorArray[2]); // eslint-disable-line new-cap
        // Only update hue and saturation if this is not a user-initiated change
        // This prevents the color picker from "jumping" when low saturation colors are selected
        if (this.userInitiatedColorChange) {
            // If user initiated, only update hue if it's significantly different
            // This allows the saturation to remain as the user set it
            const hueDiff = Math.abs(hsvArray[0] - this.hue);
            if (hueDiff > 10) {
                this.hue = hsvArray[0];
            }
            // Keep the saturation as the user set it, don't update from RGB conversion
        }
        else {
            this.hue = hsvArray[0];
            // For saturation: only update if the difference is significant (more than 5%)
            // This prevents small rounding errors from causing the color picker to jump
            const saturationDiff = Math.abs(hsvArray[1] - this.saturation);
            if (saturationDiff > 5 || this.saturation === 0 || this.saturation === 100) {
                this.saturation = hsvArray[1];
            }
        }
        // Don't update brightness from color, it's managed separately
    }
    colorArraysEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        // Allow small differences due to rounding
        // Use larger tolerance for colors with low saturation (pastel colors)
        // as they are more prone to rounding errors
        const isLowSaturation = Math.abs(a[0] - a[1]) < 30 && Math.abs(a[1] - a[2]) < 30 && Math.abs(a[0] - a[2]) < 30;
        const tolerance = isLowSaturation ? 5 : 2;
        return Math.abs(a[0] - b[0]) <= tolerance &&
            Math.abs(a[1] - b[1]) <= tolerance &&
            Math.abs(a[2] - b[2]) <= tolerance;
    }
    disconnect() {
        this.websockets.forEach(ws => {
            ws.disconnect();
        });
        this.websockets.clear();
        this.primaryWebSocket = null;
    }
}
exports.WLED = WLED;
//# sourceMappingURL=wled-accessory.js.map