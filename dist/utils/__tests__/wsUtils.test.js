"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wsUtils_1 = require("../wsUtils");
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
// Mock WebSocket
jest.mock('ws');
// Mock axios
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('WLEDWebSocket', () => {
    let mockWs;
    let wsClient;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        // Create mock WebSocket instance
        mockWs = {
            on: jest.fn(),
            send: jest.fn(),
            close: jest.fn()
        };
        ws_1.default.mockImplementation(() => mockWs);
        wsClient = new wsUtils_1.WLEDWebSocket('192.168.1.100');
    });
    afterEach(() => {
        jest.useRealTimers();
        if (wsClient) {
            wsClient.disconnect();
        }
    });
    describe('Constructor', () => {
        it('should create a WLEDWebSocket instance with the correct host', () => {
            const client = new wsUtils_1.WLEDWebSocket('192.168.1.100');
            expect(client).toBeInstanceOf(wsUtils_1.WLEDWebSocket);
        });
    });
    describe('connect', () => {
        it('should connect to the correct WebSocket URL', async () => {
            const connectPromise = wsClient.connect();
            // Simulate WebSocket open event
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            expect(ws_1.default).toHaveBeenCalledWith('ws://192.168.1.100/ws');
        });
        it('should set up event handlers', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
            expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
        });
        it('should resolve when connection is established', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await expect(connectPromise).resolves.toBeUndefined();
        });
        it('should reject on connection error', async () => {
            const connectPromise = wsClient.connect();
            const errorHandler = mockWs.on.mock.calls.find(call => call[0] === 'error')?.[1];
            if (errorHandler) {
                errorHandler(new Error('Connection failed'));
            }
            await expect(connectPromise).rejects.toThrow('Connection failed');
        });
        it('should flush message queue on connect', async () => {
            wsClient.send({ on: true });
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ on: true }));
        });
    });
    describe('send', () => {
        it('should send message when connected', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            wsClient.send({ on: true, bri: 255 });
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ on: true, bri: 255 }));
        });
        it('should queue message when not connected', () => {
            wsClient.send({ on: true });
            expect(mockWs.send).not.toHaveBeenCalled();
        });
        it('should send queued messages after connection', async () => {
            wsClient.send({ on: true });
            wsClient.send({ bri: 128 });
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            expect(mockWs.send).toHaveBeenCalledTimes(2);
        });
        it('should handle send errors gracefully', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const errorCallback = jest.fn();
            wsClient.setOnError(errorCallback);
            mockWs.send.mockImplementation(() => {
                throw new Error('Send failed');
            });
            wsClient.send({ on: true });
            expect(errorCallback).toHaveBeenCalled();
        });
    });
    describe('requestState', () => {
        it('should send state request message', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            wsClient.requestState();
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ v: true }));
        });
    });
    describe('requestLiveStream', () => {
        it('should send live stream request message', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            wsClient.requestLiveStream();
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ lv: true }));
        });
    });
    describe('message handling', () => {
        it('should call onStateUpdate callback when receiving state message', async () => {
            const stateCallback = jest.fn();
            wsClient.setOnStateUpdate(stateCallback);
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];
            const testMessage = {
                state: { on: true, bri: 255 },
                info: { ver: '0.13.0', leds: { count: 30 }, name: 'WLED', fxcount: 80, palcount: 47 }
            };
            if (messageHandler) {
                messageHandler({ toString: () => JSON.stringify(testMessage) });
            }
            expect(stateCallback).toHaveBeenCalledWith(testMessage);
        });
        it('should handle invalid JSON messages gracefully', async () => {
            const errorCallback = jest.fn();
            wsClient.setOnError(errorCallback);
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];
            if (messageHandler) {
                messageHandler({ toString: () => 'invalid json' });
            }
            expect(errorCallback).toHaveBeenCalled();
        });
        it('should handle callback errors gracefully', async () => {
            const errorCallback = jest.fn();
            wsClient.setOnError(errorCallback);
            wsClient.setOnStateUpdate(() => {
                throw new Error('Callback error');
            });
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];
            const testMessage = {
                state: { on: true, bri: 255 },
                info: { ver: '0.13.0', leds: { count: 30 }, name: 'WLED', fxcount: 80, palcount: 47 }
            };
            if (messageHandler) {
                messageHandler({ toString: () => JSON.stringify(testMessage) });
            }
            expect(errorCallback).toHaveBeenCalled();
        });
    });
    describe('reconnection', () => {
        it('should attempt to reconnect on disconnect', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
            if (closeHandler) {
                closeHandler();
            }
            // Fast-forward time to trigger reconnection
            jest.advanceTimersByTime(3000);
            expect(ws_1.default).toHaveBeenCalledTimes(2);
        });
        it('should stop reconnecting after max attempts', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
            // Trigger multiple disconnects
            for (let i = 0; i < 12; i++) {
                if (closeHandler) {
                    closeHandler();
                }
                jest.advanceTimersByTime(3000);
            }
            // Should not exceed max attempts
            expect(ws_1.default).toHaveBeenCalledTimes(11); // Initial + 10 reconnection attempts
        });
    });
    describe('disconnect', () => {
        it('should close WebSocket connection', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            wsClient.disconnect();
            expect(mockWs.close).toHaveBeenCalled();
        });
        it('should clear reconnection interval', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1];
            if (closeHandler) {
                closeHandler();
            }
            wsClient.disconnect();
            // Fast-forward time - should not reconnect
            jest.advanceTimersByTime(3000);
            expect(ws_1.default).toHaveBeenCalledTimes(1);
        });
    });
    describe('getConnected', () => {
        it('should return false when not connected', () => {
            expect(wsClient.getConnected()).toBe(false);
        });
        it('should return true when connected', async () => {
            const connectPromise = wsClient.connect();
            const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
            if (openHandler) {
                openHandler();
            }
            await connectPromise;
            expect(wsClient.getConnected()).toBe(true);
        });
    });
    describe('callback setters', () => {
        it('should set onStateUpdate callback', () => {
            const callback = jest.fn();
            wsClient.setOnStateUpdate(callback);
            // No direct way to test, but should not throw
            expect(() => wsClient.setOnStateUpdate(callback)).not.toThrow();
        });
        it('should set onError callback', () => {
            const callback = jest.fn();
            wsClient.setOnError(callback);
            expect(() => wsClient.setOnError(callback)).not.toThrow();
        });
        it('should set onConnect callback', () => {
            const callback = jest.fn();
            wsClient.setOnConnect(callback);
            expect(() => wsClient.setOnConnect(callback)).not.toThrow();
        });
        it('should set onDisconnect callback', () => {
            const callback = jest.fn();
            wsClient.setOnDisconnect(callback);
            expect(() => wsClient.setOnDisconnect(callback)).not.toThrow();
        });
    });
});
describe('loadEffectsViaHTTP', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should load effects from WLED device', async () => {
        const mockEffects = ['Solid', 'Blink', 'Rainbow'];
        mockedAxios.get.mockResolvedValue({ data: mockEffects });
        const result = await (0, wsUtils_1.loadEffectsViaHTTP)('192.168.1.100');
        expect(result).toEqual(mockEffects);
        expect(mockedAxios.get).toHaveBeenCalledWith('http://192.168.1.100/json/eff');
    });
    it('should throw error on HTTP failure', async () => {
        const error = new Error('Network error');
        mockedAxios.get.mockRejectedValue(error);
        await expect((0, wsUtils_1.loadEffectsViaHTTP)('192.168.1.100')).rejects.toThrow('Error while loading effects on 192.168.1.100: Network error');
    });
    it('should handle non-Error rejections', async () => {
        mockedAxios.get.mockRejectedValue('String error');
        await expect((0, wsUtils_1.loadEffectsViaHTTP)('192.168.1.100')).rejects.toThrow('Error while loading effects on 192.168.1.100: String error');
    });
});
//# sourceMappingURL=wsUtils.test.js.map