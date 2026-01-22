# Configuration Guide

All server configuration has been centralized into JSON files in the `configuration/` folder. The server loads these files on startup with sensible defaults if files are missing.

## Configuration Files

### `server.json`
Main server configuration file containing settings for:
- **server**: Port and Unix socket settings
- **proxy**: Reverse proxy and security settings (trust x-forwarded-for header)
- **websocket**: WebSocket protocol settings
- **performance**: Buffer/optimization settings
- **features**: Feature flags (rename, delete, username anonymization)
- **logging**: Console and file rotation settings

**Environment Variable Overrides:**
- `PORT` - Overrides `server.port`
- `TRUST_PROXY` - Set to 'true' to override `proxy.trustProxy`
- `ANONYMIZE_ADDRESSES` - Set to 'false' to override `proxy.anonymizeAddresses`
- `LOGS_DIRECTORY` - Overrides `logging.rotation.dirname`

**Example:**
```json
{
  "server": {
    "port": 9080,
    "unixSocketPermissions": 511
  },
  "performance": {
    "bufferSends": 60
  }
}
```

### `room.json`
Room management configuration:
- **limits**: Maximum rooms, clients per room, variables per room
- **janitor**: Cleanup interval and empty room thresholds

**Example:**
```json
{
  "limits": {
    "maxRooms": 16384,
    "maxClientsPerRoom": 128,
    "maxVariablesPerRoom": 128
  },
  "janitor": {
    "interval": 3600000,
    "emptyRoomThreshold": 3600000
  }
}
```

### `monitoring.json`
Variable auditing and monitoring configuration:
- **monitoring**: Enable/disable monitoring and logging
- **auditLog**: File rotation and audit log settings
- **fields**: Which data fields to include in audit logs
- **limits**: Rate limiting and suspicious activity detection
- **valueMasking**: Data masking for sensitive values

**Example:**
```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true
  },
  "auditLog": {
    "enabled": true,
    "filename": "variable-audit.log"
  }
}
```

## Configuration Loading

All configurations are loaded by `src/configLoader.js`:

1. Attempts to read JSON files from `configuration/` folder
2. Validates configuration structure
3. Falls back to hardcoded defaults if files are missing or invalid
4. Logs informational messages about which configs were loaded

**Module Structure:**
```javascript
const config = require('./configLoader');

// Access nested configurations
config.serverConfig        // Full server configuration
config.roomConfig          // Room configuration
config.monitoringConfig    // Monitoring configuration

// Backward compatibility exports for direct property access
config.port
config.trustProxy
config.anonymizeAddresses
config.logging
config.bufferSends
config.anonymizeGeneratedUsernames
config.perMessageDeflate
```

## Migration from Old System

The old configuration system used three separate JavaScript files:
- `src/config.js` (server settings)
- `src/roomConfig.js` (room settings)
- `src/monitoringConfig.js` (monitoring settings)

These have been consolidated into JSON files in the `configuration/` folder for better:
- **Manageability**: All config in one place
- **Maintainability**: JSON is easier to parse and validate
- **Documentation**: Each setting includes descriptive comments
- **Consistency**: Single loading mechanism with consistent defaults

## Adding New Configuration

To add new configuration:

1. **Update the appropriate JSON file** in `configuration/`
2. **Update the default config** in `src/configLoader.js`
3. **Update validation functions** if adding required fields
4. **Export any needed properties** for backward compatibility

## Troubleshooting

**Configuration not loaded:**
- Check file exists at `configuration/server.json` (or room.json, monitoring.json)
- Check JSON syntax is valid (use `jsonlint` or similar)
- Check file permissions are readable
- Check logs for error messages

**Default values being used:**
- Configuration file is missing or invalid
- Check console logs during startup for warnings
- Verify required sections exist in JSON file

**Environment variables not working:**
- Port: Use `PORT` environment variable
- Proxy: Use `TRUST_PROXY=true` (lowercase)
- Logs: Use `LOGS_DIRECTORY=/path/to/logs`

## Configuration Validation

Each configuration file is validated on load:

- **server.json**: Requires `server` and `logging` sections
- **room.json**: Requires valid `limits` and `janitor` sections with numeric values > 0
- **monitoring.json**: Requires `monitoring`, `auditLog`, `fields`, `limits`, and `valueMasking` sections

Invalid configurations will log warnings and use defaults instead.
