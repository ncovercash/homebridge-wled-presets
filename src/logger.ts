import { Logging } from 'homebridge';

export class Logger {
  constructor(
    private readonly upstream: Logging,
    private readonly debug: boolean,
    private readonly label: string,
  ) {}

  info(message: string, ...parameters: any[]): void {
    if (this.debug) {
      this.upstream.info(`[${this.label}] ${message}`, ...parameters);
    }
  }

  warn(message: string, ...parameters: any[]): void {
    this.upstream.warn(`[${this.label}] ${message}`, ...parameters);
  }

  error(message: string, ...parameters: any[]): void {
    this.upstream.error(`[${this.label}] ${message}`, ...parameters);
  }
}
