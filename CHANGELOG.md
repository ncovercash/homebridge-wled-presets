# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-XX-XX

### Added
- **WebSocket Support**: Real-time communication with WLED devices via WebSocket (`ws://[WLED-IP]/ws`) for instant state updates
- **Homebridge v2 Compatibility**: Full support for Homebridge v1.8+ and v2.0+
- **Improved Color Calculations**: Enhanced RGB/HSL/HSV color conversion algorithms with better precision
- **Effect Typeahead/Autocomplete**: Typeahead suggestions for all 127+ WLED effects in the configuration UI
- **Custom Effect Support**: Add custom effects for newer/older WLED versions with automatic validation
- **Comprehensive Unit Tests**: Full test coverage with 130+ tests covering all core functionality
- **Enhanced Error Handling**: Better error messages and graceful fallbacks
- **Effect Validation**: Automatic validation of effects against device's supported effects list
- **Improved Color Picker**: Better support for low saturation colors (pastel colors) in HomeKit color picker

### Changed
- **Migration from HTTP to WebSocket**: Replaced HTTP polling with WebSocket connections for real-time updates
- **Node.js Requirement**: Updated to Node.js >=18.0.0 <21.0.0 (supports v18 and v20 LTS)
- **Color Conversion**: Improved HSV to RGB conversion precision, especially for pure colors
- **State Management**: Better handling of partial state updates from WebSocket messages

### Fixed
- **Color Picker Jumping**: Fixed issue where color picker would jump back when selecting low saturation colors
- **Hue Calculation**: Fixed hue calculation precision for pure colors (green, magenta, etc.)
- **State Updates**: Fixed handling of undefined state values in WebSocket updates
- **Multiple Hosts**: Improved synchronization across multiple WLED devices

### Technical
- Added WebSocket reconnection logic with exponential backoff
- Implemented message queuing for disconnected WebSocket connections
- Added comprehensive error handling and logging
- Improved TypeScript type safety throughout the codebase

## [1.x.x] - Previous versions

See git history for previous changelog entries.

[2.0.0]: https://github.com/jstrausd/homebridge-simple-wled/compare/v1.0.0...v2.0.0

