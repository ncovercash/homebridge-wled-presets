"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLEDWebSocket = void 0;
exports.loadEffectsViaHTTP = loadEffectsViaHTTP;
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
class WLEDWebSocket {
    ws = null;
    host;
    reconnectInterval = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    reconnectDelay = 3000;
    isConnected = false;
    messageQueue = [];
    onStateUpdate = null;
    onError = null;
    onConnect = null;
    onDisconnect = null;
    constructor(host) {
        this.host = host;
    }
    connect() {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://${this.host}/ws`;
                this.ws = new ws_1.default(wsUrl);
                this.ws.on('open', () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.flushMessageQueue();
                    if (this.onConnect) {
                        this.onConnect();
                    }
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        if (message.state && message.info) {
                            // Full state update
                            if (this.onStateUpdate) {
                                try {
                                    this.onStateUpdate(message);
                                }
                                catch (callbackError) {
                                    // Log but don't throw - prevent unhandled exceptions
                                    if (this.onError) {
                                        const err = callbackError instanceof Error ? callbackError : new Error(String(callbackError));
                                        this.onError(err);
                                    }
                                }
                            }
                        }
                        else if (Array.isArray(message)) {
                            // Live LED data stream
                            // Can be handled separately if needed
                        }
                    }
                    catch (error) {
                        // Log parse errors but don't throw
                        if (this.onError) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            this.onError(err);
                        }
                    }
                });
                this.ws.on('error', (error) => {
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
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                reject(err);
            }
        });
    }
    scheduleReconnect() {
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
    flushMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            if (message && this.ws) {
                this.ws.send(message);
            }
        }
    }
    send(data) {
        try {
            const message = JSON.stringify(data);
            if (this.isConnected && this.ws) {
                try {
                    this.ws.send(message);
                }
                catch (sendError) {
                    // If send fails, queue the message
                    this.messageQueue.push(message);
                    if (this.onError) {
                        const err = sendError instanceof Error ? sendError : new Error(String(sendError));
                        this.onError(err);
                    }
                }
            }
            else {
                this.messageQueue.push(message);
            }
        }
        catch (error) {
            // Log JSON stringify errors
            if (this.onError) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.onError(err);
            }
        }
    }
    requestState() {
        this.send({ v: true });
    }
    requestLiveStream() {
        this.send({ lv: true });
    }
    setOnStateUpdate(callback) {
        this.onStateUpdate = callback;
    }
    setOnError(callback) {
        this.onError = callback;
    }
    setOnConnect(callback) {
        this.onConnect = callback;
    }
    setOnDisconnect(callback) {
        this.onDisconnect = callback;
    }
    disconnect() {
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
    getConnected() {
        return this.isConnected;
    }
}
exports.WLEDWebSocket = WLEDWebSocket;
async function loadEffectsViaHTTP(host) {
    // Fallback to HTTP for initial effect loading if WebSocket is not available
    try {
        const response = await axios_1.default.get(`http://${host}/json/eff`);
        return response.data;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Error while loading effects on ${host}: ${errorMessage}`);
    }
}
//# sourceMappingURL=wsUtils.js.map