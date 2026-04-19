export interface WLEDConfig {
  name: string;
  host: string | string[];
  log?: boolean;
  presetUpdateCheckIntervalSeconds?: number;
  softwareUpdateCheckIntervalSeconds?: number;
}
