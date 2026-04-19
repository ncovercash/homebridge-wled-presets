# Changelog

### [1.1.1] - 2026-04-18

- Fix schema for plugin verification

### [1.1.0] - 2026-04-18

- Automatically check and notify (via logs) when a new WLED version is available
- Refresh presets while running to ensure new ones are picked up/old ones are removed via polling

### [1.0.4] - 2026-04-18

- Improve handling of mass on/off requests to prevent conflicts
- Ensure custom configurations via web UI do not show as "off" in Home app

### [1.0.3] - 2026-04-18

- Improve name handling for individual services

### [1.0.2] - 2026-04-18

- Allow specifying multiple WLED hosts via comma-separated string in addition to array format

### [1.0.1] - 2026-04-18

- Fix bug with service identifiers not having correct labels

### [1.0.0] - 2026-04-18

- New implementation of plugin initialization
- Expose presets as individual Lightbulb services instead of TV services

---

See forked repository for previous changelog entries: https://github.com/jstrausd/homebridge-simple-wled/
