# Homebridge Simple WLED

[![npm](https://img.shields.io/npm/v/homebridge-wled-presets.svg)](https://www.npmjs.com/package/homebridge-wled-presets)
[![downloads](https://img.shields.io/npm/dm/homebridge-wled-presets.svg)](https://www.npmjs.com/package/homebridge-wled-presets)
[![last commit](https://img.shields.io/github/last-commit/ncovercash/homebridge-wled-presets.svg)](https://github.com/ncovercash/homebridge-wled-presets/commits)
[![build](https://img.shields.io/github/actions/workflow/status/ncovercash/homebridge-wled-presets/ci.yml?branch=main&label=build)](https://github.com/ncovercash/homebridge-wled-presets/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Test Coverage](https://codecov.io/gh/ncovercash/homebridge-wled-presets/branch/main/graph/badge.svg)](https://codecov.io/gh/ncovercash/homebridge-wled-presets)

Homebridge Plugin for WLED Strips ([WLED-Project by Aircoookie](https://github.com/Aircoookie/WLED)) centered around presets. Based on the original [homebridge-simple-wled](https://github.com/jstrausd/homebridge-simple-wled) plugin, but with a lot of non-preset options removed.

## ✨ Features

- **WebSocket Support**: Real-time communication with WLED devices via WebSocket for instant updates
- **Homebridge v2 Compatible**: Works with both Homebridge v1.8+ and v2.0+
- **Multiple Host Support**: Control multiple WLED devices with a single accessory

### ⚙️ Installation / NPM Package

Install via Homebridge UI or NPM: [NPM Package](https://www.npmjs.com/package/homebridge-wled-presets)

### Manual Configuration

Add the platform to your `config.json` in the platforms section:

```json
{
  "platforms": [
    {
      "platform": "WLED Presets",
      "wleds": [
        {
          "name": "LED-Table",
          "host": "192.168.1.100",
          "log": true
        },
        {
          "name": "LED-Box",
          "host": ["192.168.1.101", "192.168.1.102"]
        }
      ]
    }
  ]
}
```

After editing the config, restart your Homebridge server and add the accessory manually from the Home app.

## 💡💡💡 Multiple WLED Hosts

Control multiple WLED devices with a single accessory by setting `host` to an array:

**Important:** The first WLED host acts as the primary device. Changes made to the primary WLED (e.g., via the web panel) will sync to all other WLEDs in the array.

```json
{
  "platform": "WLED Presets",
  "wleds": [
    {
      "name": "LED-Table",
      "host": ["192.168.1.100", "192.168.1.101", "192.168.1.102"],
      "effects": ["Rainbow Runner", "Circus", "Fireworks"]
    }
  ]
}
```

## 🔧 Technical Details

### WebSocket Communication

The plugin uses WebSocket connections (`ws://[WLED-IP]/ws`) for real-time communication:

- Instant state updates from WLED devices
- Automatic reconnection on connection loss
- Message queuing when disconnected
- Support for up to 4 concurrent WebSocket connections per device

## 🧪 Testing

The plugin includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📝 Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development and build instructions.

## 🤝 Contributing

If you have any ideas or improvements, feel free to fork the repository and submit a pull request.

## 📄 License

ISC
