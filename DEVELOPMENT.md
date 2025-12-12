# Local Development and Build Guide

This guide explains how to build and test the plugin locally for your Homebridge setup.

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Homebridge installed (globally or locally)

## Installing Dependencies

```bash
npm install
```

## Building the Plugin

The plugin must be compiled from TypeScript to JavaScript:

```bash
npm run build
```

This creates the compiled files in the `dist/` directory.

## Linking with Homebridge

To use the plugin in your local Homebridge, you need to link it:

### Option 1: npm link (Recommended)

```bash
# In the plugin directory
npm run build
npm link

# In your Homebridge directory (usually ~/.homebridge)
cd ~/.homebridge
npm link homebridge-simple-wled
```

### Option 2: Direct linking with dev script

The `dev` script does both in one step:

```bash
npm run dev
```

This automatically executes:
1. `npm run build` - Compiles the plugin
2. `npm link` - Links the plugin globally
3. `homebridge` - Starts Homebridge (optional, if you don't want it to start automatically, remove the last part)

## Development with Automatic Rebuild

For development with automatic rebuild on changes:

### With Watch Mode (Manual)

1. Terminal 1 - Watch for TypeScript:
```bash
# Install ts-node-dev or use tsc --watch
npm install --save-dev ts-node-dev
# Or use: npx tsc --watch
```

2. Terminal 2 - Homebridge in debug mode:
```bash
homebridge -D
```

### With nodemon (Recommended)

Add `nodemon` to package.json:

```json
"scripts": {
  "watch": "nodemon --watch src --ext ts --exec \"npm run build\""
}
```

Then:
```bash
npm run watch
```

In a second terminal:
```bash
homebridge -D
```

## Homebridge Configuration

Make sure your `config.json` has the plugin correctly configured:

```json
{
  "platforms": [
    {
      "platform": "WLED",
      "wleds": [
        {
          "name": "My WLED",
          "host": "192.168.1.100",
          "effects": ["Rainbow Runner", "Circus"],
          "log": true
        }
      ]
    }
  ]
}
```

## Debugging

### Starting Homebridge in Debug Mode

```bash
homebridge -D
```

### Viewing Plugin Logs

Logs appear in the Homebridge console. If `log: true` is set in the configuration, additional debug information will be output.

### Checking TypeScript Errors

```bash
npm run build
```

### Linting

```bash
npm run lint
```

Fix errors automatically:
```bash
npm run lint:fix
```

## Running Tests

```bash
# All tests
npm test

# Tests in watch mode
npm run test:watch

# Tests with coverage report
npm run test:coverage
```

## Common Issues

### Plugin Not Found

1. Make sure `npm link` was successful
2. Check if the plugin is linked in `~/.homebridge/node_modules`:
```bash
ls -la ~/.homebridge/node_modules | grep homebridge-simple-wled
```

### Changes Not Applied

1. Run `npm run build` again
2. Restart Homebridge
3. Check if the `dist/` files were updated

### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Check for linting errors
npm run lint
```

## Production Build

Before publishing:

```bash
# Clean build
npm run clean
npm run build

# Run tests
npm test

# Linting
npm run lint
```

## Removing Link

To remove the plugin again:

```bash
# In the plugin directory
npm unlink

# In the Homebridge directory
cd ~/.homebridge
npm unlink homebridge-simple-wled
```

## Useful Commands

```bash
# Build
npm run build

# Clean (deletes dist/)
npm run clean

# Dev (build + link + homebridge)
npm run dev

# Tests
npm test

# Linting
npm run lint
npm run lint:fix
```
