import {
    type API,
    CharacteristicEventTypes,
    type Logging,
    type PlatformAccessory,
    type CharacteristicValue,
    type CharacteristicGetCallback,
    type CharacteristicSetCallback,
    type Service,
    type HAP
} from 'homebridge';
import {PLUGIN_NAME} from './settings';
import {type WLEDPlatform} from './wled-platform';
import {httpSendData} from './utils/httpUtils';

const polling = require('polling-to-event');

export class WLED {
  private readonly log: Logging;

  private readonly hap: HAP;

  private readonly api: API;

  private readonly platform: WLEDPlatform;

  private readonly Characteristic: any;

  private readonly wledAccessory: PlatformAccessory;

  private readonly name: string;

  private readonly host: string[];

  private readonly lightService: Service;

  private readonly ambilightService!: Service;

  private readonly speedService!: Service;

  private readonly effectsService!: Service;

  private readonly presetsService!: Service;

  /*        LOGGING / DEBUGGING         */
  private readonly debug: boolean = false;

  private readonly prodLogging: boolean = false;

  /*       END LOGGING / DEBUGGING      */

  private readonly effectId = 33;

  private readonly multipleHosts: boolean;

  private readonly disableEffectSwitch: boolean;

  private readonly disablePresetSwitch: boolean;

  private readonly turnOffWledWithEffect: boolean;

  private readonly showEffectControl: boolean;

  private readonly ambilightSwitch: boolean;

  /*  LOCAL CACHING VARIABLES */

  private isOffline = false;

  private lightOn = false;

  private ambilightOn = false;

  private brightness = -1;

  private hue = 100;

  private saturation = 100;

  private colorArray = [255, 0, 0];

  private preset = -1;

  private effectSpeed = 15;

  private effectsAreActive = false;

  private readonly cachedAllEffects: string[] = [];

  private readonly effects: number[] = [];

  private lastPlayedEffect: number = 0;

  private presetsAreActive = false;

  private readonly presets: number[] = [];

  private lastPlayedPreset: number = 0;

  /*  END LOCAL CACHING VARIABLES */

  constructor(platform: WLEDPlatform, wledConfig: any, loadedEffects: string[]) {
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
      } else {
          this.host = [wledConfig.host];
          this.multipleHosts = false;
      }

      this.platform = platform;
      this.api = platform.api;
      this.hap = this.api.hap;
      this.Characteristic = this.api.hap.Characteristic;
      const uuid = this.api.hap.uuid.generate('homebridge:wled' + this.name);

      if ((this.wledAccessory = this.platform.accessories.find((x: PlatformAccessory) => x.UUID === uuid)!) === undefined) {
          this.wledAccessory = new this.api.platformAccessory(this.name, uuid);
      }

      this.log.info('Setting up Accessory ' + this.name + ' with Host-IP: ' + this.host + ((this.multipleHosts) ? ' Multiple WLED-Hosts configured' : ' Single WLED-Host configured'));

      this.wledAccessory.category = this.api.hap.Categories.LIGHTBULB;

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

      this.api.publishExternalAccessories(PLUGIN_NAME, [this.wledAccessory]);
      this.platform.accessories.push(this.wledAccessory);

      this.api.updatePlatformAccessories([this.wledAccessory]);
      this.log.info('WLED Strip finished initializing!');

      this.startPolling(this.host[0]);
  }

  registerCharacteristicOnOff(): void {
      this.lightService.getCharacteristic(this.hap.Characteristic.On)
          .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
              if (this.debug) {
                  this.log('Current state of the switch was returned: ' + (this.lightOn ? 'ON' : 'OFF'));
              }

              callback(undefined, this.lightOn);
          })
          .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
              const tempLightOn = value as boolean;
              if (tempLightOn && !this.lightOn) {
                  this.turnOnWLED();
                  if (this.debug) {
                      this.log('Light was turned on!');
                  }
              } else if (!tempLightOn && this.lightOn) {
                  this.turnOffWLED();
                  if (this.debug) {
                      this.log('Light was turned off!');
                  }
              }

              this.lightOn = tempLightOn;
              callback();
          });
  }

  registerCharacteristicAmbilightOnOff(): void {
      this.ambilightService.getCharacteristic(this.hap.Characteristic.On)
          .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
              if (this.debug) {
                  this.log('Current state of the switch was returned: ' + (this.ambilightOn ? 'ON' : 'OFF'));
              }

              callback(undefined, this.ambilightOn);
          })
          .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
              this.ambilightOn = value as boolean;
              if (this.ambilightOn) {
                  this.turnOnAmbilight();
              } else {
                  this.turnOffAmbilight();
              }

              if (this.debug) {
                  this.log('Switch state was set to: ' + (this.ambilightOn ? 'ON' : 'OFF'));
              }

              callback();
          });
  }

  registerCharacteristicBrightness(): void {
      this.lightService.getCharacteristic(this.hap.Characteristic.Brightness)
          .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
              if (this.debug) {
                  this.log('Current brightness: ' + this.brightness);
              }

              callback(undefined, this.currentBrightnessToPercent());
          })
          .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
              this.brightness = Math.round(255 / 100 * (value as number));
              this.httpSetBrightness();

              if (this.prodLogging) {
                  this.log('Set brightness to ' + value + '% ' + this.brightness);
              }

              callback();
          });

      if (this.showEffectControl) {
      // EFFECT SPEED
          this.speedService.getCharacteristic(this.hap.Characteristic.Brightness)
              .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                  callback(undefined, Math.round(this.effectSpeed / 2.55));
              }).on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                  this.effectSpeed = value as number;
                  this.effectSpeed = Math.round(this.effectSpeed * 2.55);
                  if (this.prodLogging) {
                      this.log('Speed set to ' + this.effectSpeed);
                  }

                  this.effectsService.setCharacteristic(this.Characteristic.ActiveIdentifier, this.lastPlayedEffect);

                  callback();
              });
      }
  }

  registerCharacteristicHue(): void {
      this.lightService.getCharacteristic(this.hap.Characteristic.Hue)
          .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
              const colorArray = this.HSVtoRGB(this.hue, this.saturation);
              this.colorArray = colorArray;
              if (this.debug) {
                  this.log('Current hue: ' + this.hue + '%');
              }

              callback(undefined, this.hue);
          })
          .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
              this.hue = value as number;
              this.turnOffAllEffects();
              const colorArray = this.HSVtoRGB(this.hue, this.saturation);

              this.host.forEach(host => {
                  httpSendData(`http://${host}/json`, 'POST', {bri: this.brightness, seg: [{col: [colorArray]}]}, (error: any, response: any) => {
                      if (error) {
                          this.log('Error while changing color of WLED ' + this.name + ' (' + host + ')');
                      }
                  });
                  if (this.prodLogging) {
                      this.log('Changed color to ' + colorArray + ' on host ' + host);
                  }
              });
              this.colorArray = colorArray;

              callback();
          });
  }

  registerCharacteristicSaturation(): void {
      this.lightService.getCharacteristic(this.hap.Characteristic.Saturation)
          .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
              if (this.debug) {
                  this.log('Current saturation: ' + this.saturation + '%');
              }

              callback(undefined, this.saturation);
          })
          .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
              this.saturation = value as number;
              this.turnOffAllEffects();
              callback();
          });
  }

  registerCharacteristicEffectsActive(): void {
      this.effectsService.getCharacteristic(this.Characteristic.Active)
          .on(CharacteristicEventTypes.SET, (newValue: any, callback: any) => {
              if (newValue == 0) {
                  if (this.turnOffWledWithEffect) {
                      this.turnOffWLED();
                  } else {
                      this.turnOffAllEffects();
                  }

                  this.effectsAreActive = false;
              } else {
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

  registerCharacteristicEffectsActiveIdentifier(): void {
      this.effectsService.getCharacteristic(this.Characteristic.ActiveIdentifier)
          .on(CharacteristicEventTypes.SET, (newValue: CharacteristicValue, callback: CharacteristicSetCallback) => {
              if (this.effectsAreActive) {
                  const effectID = this.effects[parseInt(newValue.toString())];
                  this.host.forEach(host => {
                      httpSendData(`http://${host}/json`, 'POST', {seg: [{fx: effectID, sx: this.effectSpeed}]}, (error: any, resp: any) => {
                          if (error) {}
                      });
                  });
                  if (this.prodLogging) {
                      this.log('Turned on ' + newValue + ' effect!');
                  }

                  this.lastPlayedEffect = parseInt(newValue.toString());
              }

              callback(null);
          });
  }

  registerCharacteristicPresetsActive(): void {
      this.presetsService.getCharacteristic(this.Characteristic.Active)
          .on(CharacteristicEventTypes.SET, (newValue: any, callback: any) => {
              if (newValue == 0) {
                  this.turnOffAllPresets();
                  this.presetsAreActive = false;
              } else {
                  this.turnOnWLED();
                  this.presetsAreActive = true;
                  this.presetsService.setCharacteristic(this.Characteristic.ActiveIdentifier, this.lastPlayedPreset);
              }

              this.presetsService.updateCharacteristic(this.Characteristic.Active, newValue);
              callback(null);
          });
  }

  registerCharacteristicPresetsActiveIdentifier(): void {
      this.presetsService.getCharacteristic(this.Characteristic.ActiveIdentifier)
          .on(CharacteristicEventTypes.SET, (newValue: CharacteristicValue, callback: CharacteristicSetCallback) => {
              if (this.presetsAreActive) {
                  const presetID = this.presets[parseInt(newValue.toString())];
                  this.host.forEach(host => {
                      httpSendData(`http://${host}/json`, 'POST', {ps: presetID + 1}, (error: any, resp: any) => {
                          if (error) {}
                      });
                  });
                  if (this.prodLogging) {
                      this.log('Switched to ' + newValue + ' preset!');
                  }

                  this.lastPlayedPreset = parseInt(newValue.toString());
              }

              callback(null);
          });
  }

  addEffectsInputSources(effects: any): void {
      if (this.prodLogging) {
          this.log('Adding effects: ' + effects);
      }

      effects.forEach((effectName: string, i: number) => {
          const effectID = this.getEffectIdByName(effectName);
          this.effects.push(effectID);
          const effectInputSource = this.wledAccessory.addService(this.hap.Service.InputSource, effectID, effectName);
          effectInputSource
              .setCharacteristic(this.Characteristic.Identifier, i)
              .setCharacteristic(this.Characteristic.ConfiguredName, effectName)
              .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
              .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
          this.effectsService.addLinkedService(effectInputSource);
      });
  }

  addPresetsInputSources(presets: any): void {
      if (this.prodLogging) {
          this.log('Adding presets: ' + presets);
      }

      presets.forEach((presetName: string, i: number) => {
          const presetID = i;
          this.presets.push(presetID);
          const presetInputSource = this.wledAccessory.addService(this.hap.Service.InputSource, presetID, presetName);
          presetInputSource
              .setCharacteristic(this.Characteristic.Identifier, presetID)
              .setCharacteristic(this.Characteristic.ConfiguredName, presetName)
              .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
              .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
          this.presetsService.addLinkedService(presetInputSource);
      });
  }

  httpSetBrightness() {
      if (this.brightness == 0) {
          this.turnOffWLED();
          return;
      }

      const colorArray = this.HSVtoRGB(this.hue, this.saturation);
      this.colorArray = colorArray;
      if (this.debug) {
          this.log('COLOR ARRAY BRIGHTNESS: ' + colorArray);
      }

      this.host.forEach(host => {
          httpSendData(`http://${host}/json`, 'POST', {bri: this.brightness}, (error: any, response: any) => {
              if (error) {}
          });
      });
  }

  turnOffWLED(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/win&T=0`, 'GET', {}, (error: any, response: any) => {
              if (error) {}
          });
      });
      this.lightOn = false;
  }

  turnOnWLED(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/win&T=1`, 'GET', {}, (error: any, response: any) => {
              if (error) {}
          });
      });
      this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, 100);
      this.lightOn = true;
  }

  turnOffAmbilight(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/win&LO=1`, 'GET', {}, (error: any, response: any) => {
              if (error) {}
          });
      });
      this.ambilightOn = false;
  }

  turnOnAmbilight(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/win&LO=0`, 'GET', {}, (error: any, response: any) => {
              if (error) {}
          });
      });
      this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, 100);
      this.ambilightOn = true;
  }

  turnOffAllEffects(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/json`, 'POST', {seg: [{fx: 0, sx: 0, col: this.colorArray}]}, (error: any, response: any) => {
              if (error) {}
          });
      });
      if (!this.disableEffectSwitch) {
          this.effectsService.updateCharacteristic(this.Characteristic.Active, 0);
      }

      if (this.debug) {
          this.log('Turned off Effects!');
      }
  }

  turnOffAllPresets(): void {
      this.host.forEach(host => {
          httpSendData(`http://${host}/json`, 'POST', {ps: -1}, (error: any, resp: any) => {
              if (error) {}
          });
      });
      if (!this.disableEffectSwitch) {
          this.effectsService.updateCharacteristic(this.Characteristic.Active, 0);
      }

      if (this.debug) {
          this.log('Cleared Presets!');
      }
  }

  getEffectIdByName(name: string): number {
      const effectNr = this.getAllEffects().indexOf(name);
      if (effectNr >= 0) {
          return effectNr;
      }

      if (this.debug) {
          this.log('Effect ' + name + ' not found! Displaying Rainbow Runner');
      }

      return this.getAllEffects().indexOf('Rainbow Runner');
  }

  getAllEffects(): string[] {
      return this.cachedAllEffects;
  }

  updateLight(): void {
      this.lightService.updateCharacteristic(this.hap.Characteristic.On, this.lightOn);
      this.lightService.updateCharacteristic(this.hap.Characteristic.Brightness, this.currentBrightnessToPercent());
      this.lightService.updateCharacteristic(this.hap.Characteristic.Saturation, this.saturation);
      this.lightService.updateCharacteristic(this.hap.Characteristic.Hue, this.hue);

      if (this.ambilightService) {
          this.ambilightService.updateCharacteristic(this.hap.Characteristic.On, this.ambilightOn);
      }

      if (this.presetsService) {
          if (this.preset == -1) {
              this.presetsService.updateCharacteristic(this.Characteristic.Active, false);
          } else {
              this.presetsService.updateCharacteristic(this.Characteristic.Active, true);
          }
      }
  }

  startPolling(host: string): void {
      const that = this;
      const status = polling(function(done: any) {
          if (!that.isOffline) {
              httpSendData(`http://${host}/json/state`, 'GET', {}, (error: any, response: any) => {
                  done(error, response);
              });
          } else {
              that.isOffline = false;
          }
      }, {longpolling: true, interval: 4500, longpollEventName: 'statuspoll' + host});

      status.on('poll', function(response: any) {
          let colorResponse = response.data.seg[0].col[0];
          colorResponse = [colorResponse[0], colorResponse[1], colorResponse[2]];

          if (that.lightOn && response.data.on && (
              that.brightness != response.data.bri ||
        !that.colorArraysEqual(colorResponse, that.colorArray))) {
              if (that.prodLogging) {
                  that.log('Updating WLED in HomeKIT (Because of Polling) ' + host);
              }

              that.saveColorArrayAsHSV(colorResponse);
              that.colorArray = colorResponse;

              that.brightness = response.data.bri;

              if (that.multipleHosts) {
                  that.host.forEach(host => {
                      httpSendData(`http://${host}/json`, 'POST', {bri: that.brightness, seg: [{col: [colorResponse]}]}, (error: any, response: any) => {
                          if (error) {
                              that.log('Error while polling WLED (brightness) ' + that.name + ' (' + that.host + ')');
                          }
                      });
                      if (that.prodLogging) {
                          that.log('Changed color to ' + colorResponse + ' on host ' + host);
                      }
                  });
              }

              that.updateLight();
          } else {
              that.lightOn = response.data.on;
              that.updateLight();
          }

          if (that.ambilightOn && response.data.lor) {
              that.ambilightOn = !response.data.lor;

              if (that.prodLogging) {
                  that.log('Updating WLED in HomeKIT (Because of Polling) ' + host);
              }

              if (that.multipleHosts) {
                  that.host.forEach(host => {
                      httpSendData(`http://${host}/json`, 'POST', {lor: that.ambilightOn}, (error: any, response: any) => {
                          if (error) {
                              that.log('Error while polling WLED (brightness) ' + that.name + ' (' + that.host + ')');
                          }
                      });
                      if (that.prodLogging) {
                          that.log('Changed color to ' + colorResponse + ' on host ' + host);
                      }
                  });
              }

              that.updateLight();
          } else {
              that.ambilightOn = !response.data.lor;
              that.updateLight();
          }

          that.preset = response.data.ps;
          that.updateLight();
      });

      status.on('error', function(error: any, response: any) {
          if (error) {
              if (that.debug) {
                  that.log(error);
              }

              that.log('Error while polling WLED ' + that.name + ' (' + that.host + ')');
              that.isOffline = true;
          }
      });
  }

  currentBrightnessToPercent() {
      return Math.round(100 / 255 * this.brightness);
  }

  saveColorArrayAsHSV(colorArray: number[]): void {
      const hsvArray = this.RGBtoHSV(colorArray[0], colorArray[1], colorArray[2]);
      this.hue = Math.floor(hsvArray[0] * 360);
      this.saturation = Math.floor(hsvArray[1] * 100);
      this.brightness = Math.floor(hsvArray[2] * 255);
  }

  colorArraysEqual(a: any, b: any): boolean {
      if (a[0] == b[0] && a[1] == b[1] && a[2] == b[2]) {
          return true;
      }

      return false;
  }
}
