import {WLEDPlatform} from '../wled-platform';
import {loadEffectsViaHTTP} from '../utils/wsUtils';
import {WLED} from '../wled-accessory';

// Mock dependencies
jest.mock('../utils/wsUtils');
jest.mock('../wled-accessory');

describe('WLEDPlatform', () => {
    let mockApi: any;
    let mockLog: any;
    let mockConfig: any;
    let platform: WLEDPlatform;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLog = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };

        mockApi = {
            on: jest.fn(),
            hap: {
                uuid: {
                    generate: jest.fn().mockReturnValue('test-uuid')
                }
            },
            publishExternalAccessories: jest.fn(),
            updatePlatformAccessories: jest.fn(),
            platformAccessory: jest.fn()
        };

        mockConfig = {
            wleds: [
                {
                    name: 'Test WLED 1',
                    host: '192.168.1.100',
                    effects: ['Rainbow Runner']
                },
                {
                    name: 'Test WLED 2',
                    host: '192.168.1.101',
                    effects: ['Circus']
                }
            ]
        };

        (loadEffectsViaHTTP as jest.Mock).mockResolvedValue(['Solid', 'Rainbow Runner', 'Circus']);
    });

    describe('Constructor', () => {
        it('should create platform instance with valid config', () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            expect(platform).toBeInstanceOf(WLEDPlatform);
            expect(mockApi.on).toHaveBeenCalled();
        });

        it('should handle missing config gracefully', () => {
            platform = new WLEDPlatform(mockLog, null as any, mockApi);

            expect(platform).toBeInstanceOf(WLEDPlatform);
        });

        it('should handle empty wleds array', () => {
            const emptyConfig = {platform: 'WLED', wleds: []};
            platform = new WLEDPlatform(mockLog, emptyConfig, mockApi);

            expect(mockLog.info).toHaveBeenCalledWith('No WLEDs have been configured. Plugin will not start until WLED devices are added in the Homebridge UI.');
        });

        it('should handle missing wleds property', () => {
            const noWledsConfig = {};
            platform = new WLEDPlatform(mockLog, noWledsConfig as any, mockApi);

            expect(mockLog.info).toHaveBeenCalled();
        });

        it('should register DID_FINISH_LAUNCHING event', () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            expect(mockApi.on).toHaveBeenCalledWith('didFinishLaunching', expect.any(Function));
        });
    });

    describe('configureAccessory', () => {
        it('should add accessory to accessories array', () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);
            const mockAccessory = {UUID: 'test-uuid'} as any;

            platform.configureAccessory(mockAccessory);

            expect(platform.accessories).toContain(mockAccessory);
        });

        it('should handle multiple accessories', () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);
            const accessory1 = {UUID: 'uuid-1'} as any;
            const accessory2 = {UUID: 'uuid-2'} as any;

            platform.configureAccessory(accessory1);
            platform.configureAccessory(accessory2);

            expect(platform.accessories).toHaveLength(2);
        });
    });

    describe('launchWLEDs', () => {
        it('should load effects and create WLED instances', async () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(loadEffectsViaHTTP).toHaveBeenCalledTimes(2);
            expect(WLED).toHaveBeenCalledTimes(2);
        });

        it('should handle missing host gracefully', async () => {
            const invalidConfig = {
                platform: 'WLED',
                wleds: [
                    {
                        name: 'Invalid WLED'

                        // Host missing
                    }
                ]
            };

            platform = new WLEDPlatform(mockLog, invalidConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.warn).toHaveBeenCalled();
            expect(WLED).not.toHaveBeenCalled();
        });

        it('should handle array host configuration', async () => {
            const arrayHostConfig = {
                platform: 'WLED',
                wleds: [
                    {
                        name: 'Multi Host WLED',
                        host: ['192.168.1.100', '192.168.1.101']
                    }
                ]
            };

            platform = new WLEDPlatform(mockLog, arrayHostConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(loadEffectsViaHTTP).toHaveBeenCalledWith('192.168.1.100');
        });

        it('should handle effect loading errors gracefully', async () => {
            (loadEffectsViaHTTP as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.error).toHaveBeenCalled();

            // Should still create WLED instance with empty effects
            expect(WLED).toHaveBeenCalled();
        });

        it('should handle WLED creation errors gracefully', async () => {
            (WLED as jest.MockedClass<typeof WLED>).mockImplementationOnce(() => {
                throw new Error('Creation error');
            });

            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.error).toHaveBeenCalled();
        });

        it('should handle invalid wleds array', async () => {
            const invalidConfig = {
                platform: 'WLED',
                wleds: null
            };

            platform = new WLEDPlatform(mockLog, invalidConfig as any, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            // When wleds is null, the constructor checks and returns early, so launchWLEDs is never called
            // The warning is logged in launchWLEDs, but since it's never called, we check for info log instead
            // Actually, with null wleds, the constructor should log info about no WLEDs configured
            expect(mockLog.info).toHaveBeenCalled();
        });

        it('should handle null wled entry gracefully', async () => {
            const nullWledConfig = {
                wleds: [
                    null,
                    {
                        name: 'Valid WLED',
                        host: '192.168.1.100'
                    }
                ]
            };

            platform = new WLEDPlatform(mockLog, nullWledConfig as any, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.warn).toHaveBeenCalled();

            // Should still process valid entries
            expect(WLED).toHaveBeenCalled();
        });

        it('should handle empty host string gracefully', async () => {
            const emptyHostConfig = {
                platform: 'WLED',
                wleds: [
                    {
                        name: 'Empty Host WLED',
                        host: ''
                    }
                ]
            };

            platform = new WLEDPlatform(mockLog, emptyHostConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.warn).toHaveBeenCalled();
        });

        it('should handle launch errors gracefully', () => {
            // Mock API.on to throw error
            const originalOn = mockApi.on;
            mockApi.on = jest.fn(() => {
                throw new Error('Launch error');
            });

            expect(() => {
                platform = new WLEDPlatform(mockLog, mockConfig, mockApi);
            }).not.toThrow();

            expect(mockLog.error).toHaveBeenCalledWith('Error registering platform event: Launch error');

            // Restore original
            mockApi.on = originalOn;
        });
    });

    describe('Error handling', () => {
        it('should catch and log errors during launch', async () => {
            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];

            // Mock loadEffectsViaHTTP to throw
            (loadEffectsViaHTTP as jest.Mock).mockRejectedValue(new Error('Test error'));

            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.error).toHaveBeenCalled();
        });

        it('should handle errors in WLED constructor', async () => {
            (WLED as jest.MockedClass<typeof WLED>).mockImplementation(() => {
                throw new Error('WLED constructor error');
            });

            platform = new WLEDPlatform(mockLog, mockConfig, mockApi);

            const launchHandler = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'didFinishLaunching')?.[1];
            if (launchHandler) {
                launchHandler();
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockLog.error).toHaveBeenCalled();
        });
    });
});
