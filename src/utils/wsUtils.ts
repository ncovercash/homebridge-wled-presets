import WebSocket from 'ws';
import axios from 'axios';

export interface WLEDState {
    on?: boolean;
    bri?: number;
    transition?: number;
    ps?: number;
    pl?: number;
    seg?: {
        id?: number;
        start?: number;
        stop?: number;
        col?: number[][];
        fx?: number;
        sx?: number;
        ix?: number;
        pal?: number;
        on?: boolean | string;
    }[];
    lor?: number;
    [key: string]: any;
}

export interface WLEDInfo {
    ver: string;
    leds: {
        count: number;
        rgbw?: boolean;
    };
    name: string;
    fxcount: number;
    palcount: number;
    [key: string]: any;
}

export interface WLEDResponse {
    state: WLEDState;
    info: WLEDInfo;
}

export class WLEDWebSocket {
    private ws: WebSocket | null = null;

    private host: string;

    private reconnectInterval: ReturnType<typeof setTimeout> | null = null;

    private reconnectAttempts = 0;

    private maxReconnectAttempts = 10;

    private reconnectDelay = 3000;

    private isConnected = false;

    private messageQueue: string[] = [];

    private onStateUpdate: ((data: WLEDResponse) => void) | null = null;

    private onError: ((error: Error) => void) | null = null;

    private onConnect: (() => void) | null = null;

    private onDisconnect: (() => void) | null = null;

    constructor(host: string) {
        this.host = host;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://${this.host}/ws`;
                this.ws = new WebSocket(wsUrl);

                this.ws.on('open', () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.flushMessageQueue();
                    if (this.onConnect) {
                        this.onConnect();
                    }

                    resolve();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        if (message.state && message.info) {
                            // Full state update
                            if (this.onStateUpdate) {
                                try {
                                    this.onStateUpdate(message as WLEDResponse);
                                } catch (callbackError) {
                                    // Log but don't throw - prevent unhandled exceptions
                                    if (this.onError) {
                                        const err = callbackError instanceof Error ? callbackError : new Error(String(callbackError));
                                        this.onError(err);
                                    }
                                }
                            }
                        } else if (Array.isArray(message)) {
                            // Live LED data stream
                            // Can be handled separately if needed
                        }
                    } catch (error) {
                        // Log parse errors but don't throw
                        if (this.onError) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            this.onError(err);
                        }
                    }
                });

                this.ws.on('error', (error: Error | unknown) => {
                    this.isConnected = false;
                    const err = error instanceof Error ? error : new Error(String(error));
                    if (this.onError) {
                        this.onError(err);
                    }

                    if (this.reconnectAttempts === 0) {
                        reject(err);
                    }
                });

                this.ws.on('close', () => {
                    this.isConnected = false;
                    if (this.onDisconnect) {
                        this.onDisconnect();
                    }

                    this.scheduleReconnect();
                });
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                reject(err);
            }
        });
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.reconnectAttempts++;
        this.reconnectInterval = setTimeout(() => {
            this.connect().catch(() => {
                // Reconnection will be retried
            });
        }, this.reconnectDelay);
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            if (message && this.ws) {
                this.ws.send(message);
            }
        }
    }

    send(data: WLEDState | { v?: boolean; lv?: boolean }): void {
        try {
            const message = JSON.stringify(data);
            if (this.isConnected && this.ws) {
                try {
                    this.ws.send(message);
                } catch (sendError) {
                    // If send fails, queue the message
                    this.messageQueue.push(message);
                    if (this.onError) {
                        const err = sendError instanceof Error ? sendError : new Error(String(sendError));
                        this.onError(err);
                    }
                }
            } else {
                this.messageQueue.push(message);
            }
        } catch (error) {
            // Log JSON stringify errors
            if (this.onError) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.onError(err);
            }
        }
    }

    requestState(): void {
        this.send({v: true});
    }

    requestLiveStream(): void {
        this.send({lv: true});
    }

    setOnStateUpdate(callback: (data: WLEDResponse) => void): void {
        this.onStateUpdate = callback;
    }

    setOnError(callback: (error: Error) => void): void {
        this.onError = callback;
    }

    setOnConnect(callback: () => void): void {
        this.onConnect = callback;
    }

    setOnDisconnect(callback: () => void): void {
        this.onDisconnect = callback;
    }

    disconnect(): void {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }

    getConnected(): boolean {
        return this.isConnected;
    }
}

export async function loadEffectsViaHTTP(host: string): Promise<string[]> {
    // Fallback to HTTP for initial effect loading if WebSocket is not available
    try {
        const response = await axios.get(`http://${host}/json/eff`);
        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Error while loading effects on ${host}: ${errorMessage}`);
    }
}
