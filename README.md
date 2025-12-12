# Homebridge Simple WLED

[![npm](https://img.shields.io/npm/v/homebridge-simple-wled.svg)](https://www.npmjs.com/package/homebridge-simple-wled)
[![downloads](https://img.shields.io/npm/dm/homebridge-simple-wled.svg)](https://www.npmjs.com/package/homebridge-simple-wled)
[![last commit](https://img.shields.io/github/last-commit/jstrausd/homebridge-simple-wled.svg)](https://github.com/jstrausd/homebridge-simple-wled/commits)
[![build](https://img.shields.io/github/actions/workflow/status/jstrausd/homebridge-simple-wled/ci.yml?branch=main&label=build)](https://github.com/jstrausd/homebridge-simple-wled/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0%20%3C21.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Test Coverage](https://codecov.io/gh/jstrausd/homebridge-simple-wled/branch/main/graph/badge.svg)](https://codecov.io/gh/jstrausd/homebridge-simple-wled)

Homebridge Plugin for WLED Strips ([WLED-Project by Aircoookie](https://github.com/Aircoookie/WLED))

## ✨ Features

- **WebSocket Support**: Real-time communication with WLED devices via WebSocket for instant updates
- **Homebridge v2 Compatible**: Works with both Homebridge v1.8+ and v2.0+
- **Improved Color Calculations**: Enhanced RGB/HSL/HSV color conversion with better precision
- **Effect Autocomplete**: Typeahead suggestions for all 127+ WLED effects
- **Custom Effect Support**: Add custom effects for newer/older WLED versions with automatic validation
- **Multiple Host Support**: Control multiple WLED devices with a single accessory
- **Effect & Preset Control**: Switch between effects and presets via HomeKit
- **Ambilight Support**: Toggle between Ambilight and Moodlight modes
- **Effect Speed Control**: Adjustable effect speed via HomeKit

### ❓ Help

For faster support and information, join our Discord: https://discord.gg/qpbUtZCB2H

### ⚙️ Installation / NPM Package

Install via Homebridge UI or NPM: [NPM Package](https://www.npmjs.com/package/homebridge-simple-wled)

## 🔨 Configuration

The plugin can be configured via the Homebridge UI. The configuration schema provides:

- **Typeahead Effect Selection**: Autocomplete suggestions for all WLED effects
- **Custom Effect Support**: Type any effect name - the plugin validates it against your WLED device
- **Automatic Validation**: Effects are checked against your device's supported effects at startup

### Manual Configuration

Add the platform to your `config.json` in the platforms section:

```json
{
  "platforms": [
    {
      "platform": "WLED",
      "wleds": [
        {
          "name": "LED-Table",
          "host": "192.168.1.100",
          "effects": ["Rainbow Runner", "Circus", "Fireworks"],
          "log": true
        },
        {
          "name": "LED-Box",
          "host": ["192.168.1.101", "192.168.1.102"],
          "effects": ["Rainbow Runner", "Circus"]
        }
      ]
    }
  ]
}
```

After editing the config, restart your Homebridge server and add the accessory manually from the Home app.

## 💡 Configure Effect Switch

> **Note:** You can't enable the Effect-Switch and Preset-Switch at the same time!

### Using the Homebridge UI

1. Open the plugin configuration in Homebridge UI
2. Add effects using the typeahead field - suggestions will appear as you type
3. You can select from the list or type custom effect names
4. Effects are automatically validated against your WLED device's supported effects

### Manual Configuration

Add an `effects` array to your WLED configuration. All available effects can be found in the [WLED Effects Documentation](https://kno.wled.ge/features/effects/).

```json
{
  "platform": "WLED",
  "wleds": [
    {
      "name": "LED-Table",
      "host": "192.168.1.100",
      "effects": ["Rainbow Runner", "Circus", "Fireworks", "Aurora"],
      "log": false
    }
  ]
}
```

### Custom Effects

You can add custom effect names for:
- Newer WLED versions with effects not yet in the list
- Older WLED versions with retired effects
- Custom compiled WLED builds

The plugin will:
- Validate effects against your device's supported effects at startup
- Show warnings for unsupported effects but still allow them
- Use fallback effects if a custom effect is not found

### Effect Options

**Turn off WLED when effect is turned off:**
```json
{
  "name": "LED-Table",
  "host": "192.168.1.100",
  "effects": ["Rainbow Runner", "Circus"],
  "turnOffWledWithEffect": true
}
```

**Disable Effect Switch:**
Simply remove the `effects` option to use only the standard LightBulb functionality.

### 🛠 Configure Effect Speed

**Default Effect Speed:**
```json
{
  "name": "LED-Table",
  "host": "192.168.1.100",
  "effects": ["Rainbow Runner", "Circus"],
  "defaultEffectSpeed": 20
}
```

**Effect Speed Control (HomeKit Accessory):**
```json
{
  "name": "LED-Table",
  "host": "192.168.1.100",
  "effects": ["Rainbow Runner", "Circus"],
  "showEffectControl": true
}
```

## 💡 Configure Preset Switch

> **Note:** You can't enable the Effect-Switch and Preset-Switch at the same time!

Add a `presets` array with your preset names. The order must match your WLED presets (Preset 1 = first index, Preset 2 = second index, etc.):

```json
{
  "platform": "WLED",
  "wleds": [
    {
      "name": "LED-Table",
      "host": "192.168.1.100",
      "presets": ["Christmas", "Halloween", "Morning", "Night"],
      "log": false
    }
  ]
}
```

To disable the Preset Switch, simply remove the `presets` option.

## 💡💡💡 Multiple WLED Hosts

Control multiple WLED devices with a single accessory by setting `host` to an array:

**Important:** The first WLED host acts as the primary device. Changes made to the primary WLED (e.g., via the web panel) will sync to all other WLEDs in the array.

```json
{
  "platform": "WLED",
  "wleds": [
    {
      "name": "LED-Table",
      "host": ["192.168.1.100", "192.168.1.101", "192.168.1.102"],
      "effects": ["Rainbow Runner", "Circus", "Fireworks"]
    }
  ]
}
```

## 🌦 Ambilight Switch

Add a switch to toggle between Ambilight and Moodlight modes:

```json
{
  "platform": "WLED",
  "wleds": [
    {
      "name": "LED-Table",
      "host": "192.168.1.100",
      "effects": ["Rainbow Runner", "Circus"],
      "ambilightSwitch": true
    }
  ]
}
```

This works with multiple IP addresses and effects as described above. Default is `false` if not specified.

## 🔧 Technical Details

### WebSocket Communication

The plugin uses WebSocket connections (`ws://[WLED-IP]/ws`) for real-time communication:
- Instant state updates from WLED devices
- Automatic reconnection on connection loss
- Message queuing when disconnected
- Support for up to 4 concurrent WebSocket connections per device

### Color Handling

- Improved HSV to RGB conversion with better precision
- Enhanced color picker support for low saturation colors
- Automatic color synchronization across multiple WLED devices

### Effect Validation

- Effects are loaded from your WLED device at startup
- Custom effects are validated and warnings are shown if not supported
- Fallback mechanisms ensure the plugin continues working even with unsupported effects

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

## ☕ Donation

You can support the development of this plugin by buying me a coffee:

<a href="https://www.buymeacoffee.com/jstrausd" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/arial-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

Powered by:
<br>
<a href="https://jstrauss.at" target="_blank"><img src="https://jstrauss.at/media/Logo_horizontal_white.png" alt="jstrauss.at Logo" style="height: 60px;"/></a>

Thanks to everyone who supports this project!

## 📄 License

ISC
