# Variable Monitoring and Audit Logging System

## Overview

This comprehensive monitoring system logs detailed information about variable changes in cloud rooms, enabling auditing, rate limiting, and security monitoring.

## Configuration File: `configuration/monitoring.json`

### Main Sections

#### 1. **monitoring** - Enable/disable monitoring features
```json
{
  "enabled": true,                    // Master switch for all monitoring
  "logVariableChanges": true,         // Log all variable changes
  "logFormat": "detailed"             // Format: "detailed", "simple", "json"
}
```

#### 2. **auditLog** - Configure audit log output
```json
{
  "enabled": true,
  "filename": "variable-audit.log",   // Base filename
  "dirname": "logs",                  // Directory path
  "datePattern": "YYYY-MM-DD",        // Daily rotation pattern
  "maxFiles": "7d",                   // Keep 7 days of logs
  "maxSize": "100m",                  // Rotate at 100MB
  "createSymlink": true               // Create symlink to latest log
}
```

#### 3. **fields** - Choose which fields to log
```json
{
  "timestamp": true,                  // ISO 8601 timestamp
  "ip": true,                         // Client IP address
  "username": true,                   // Client username
  "roomId": true,                     // Room ID
  "variableName": true,               // Variable name
  "oldValue": true,                   // Previous value (not for create)
  "newValue": true,                   // New value
  "userAgent": true,                  // Client user agent string
  "action": true,                     // Action: "create", "update", "delete"
  "clientCount": true,                // Number of clients in room
  "valueType": true                   // Type of value: "string", "number", etc.
}
```

#### 4. **limits** - Rate limiting and suspicious activity detection
```json
{
  "enableRateLimiting": false,                    // Enable rate limit enforcement
  "maxChangesPerSecondPerClient": 100,            // Max changes per second per client
  "maxChangesPerMinutePerVariable": 1000,         // Max changes per minute per variable
  "logSuspiciousActivity": true,                  // Flag suspicious activity
  "suspiciousThreshold": 50                       // Threshold for flagging
}
```

#### 5. **valueMasking** - Protect sensitive data in logs
```json
{
  "enabled": false,                   // Enable value masking
  "maskLongValues": true,             // Mask values exceeding maxValueLength
  "maxValueLength": 100,              // Max length before truncation
  "maskSensitivePatterns": false      // Mask patterns like emails, phones
}
```

## Log Output Format

Logs are stored in `logs/variable-audit.YYYY-MM-DD.log` as JSON lines.

### Example Log Entry
```json
{
  "timestamp": "2026-01-18T15:30:45.123Z",
  "ip": "192.168.1.100",
  "username": "player42",
  "roomId": "12345",
  "variableName": "score",
  "oldValue": 100,
  "newValue": 150,
  "userAgent": "Mozilla/5.0...",
  "action": "update",
  "clientCount": 3,
  "valueType": "number"
}
```

### Example with Suspicious Activity
```json
{
  "timestamp": "2026-01-18T15:30:50.456Z",
  "ip": "192.168.1.100",
  "username": "player42",
  "roomId": "12345",
  "variableName": "score",
  "oldValue": 150,
  "newValue": 200,
  "action": "update",
  "clientCount": 3,
  "suspicious": true,
  "alert": "Suspicious activity detected - possible rate limit exceeded"
}
```

## Configuration Examples

### Minimal Logging (Performance)
```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true,
    "logFormat": "simple"
  },
  "fields": {
    "timestamp": true,
    "ip": false,
    "username": false,
    "roomId": true,
    "variableName": true,
    "newValue": true,
    "action": true,
    "clientCount": false,
    "valueType": false
  }
}
```

### Detailed Auditing (Compliance)
```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true,
    "logFormat": "detailed"
  },
  "fields": {
    "timestamp": true,
    "ip": true,
    "username": true,
    "roomId": true,
    "variableName": true,
    "oldValue": true,
    "newValue": true,
    "userAgent": true,
    "action": true,
    "clientCount": true,
    "valueType": true
  },
  "limits": {
    "enableRateLimiting": true,
    "logSuspiciousActivity": true
  }
}
```

### Security Monitoring (Rate Limiting)
```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true
  },
  "limits": {
    "enableRateLimiting": true,
    "maxChangesPerSecondPerClient": 50,
    "maxChangesPerMinutePerVariable": 500,
    "logSuspiciousActivity": true,
    "suspiciousThreshold": 25
  }
}
```

### Production with Value Masking
```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true
  },
  "valueMasking": {
    "enabled": true,
    "maskLongValues": true,
    "maxValueLength": 100,
    "maskSensitivePatterns": true
  },
  "limits": {
    "enableRateLimiting": true,
    "logSuspiciousActivity": true
  }
}
```

## Rate Limiting Logic

### Per-Client Limits
- **Max per second**: Tracked separately for each client IP
- **Action**: If exceeded, logged as suspicious

### Per-Variable Limits
- **Max per minute**: Tracked separately for each variable
- **Action**: If exceeded, logged as suspicious

### Cleanup
- Old entries automatically cleaned up every 60 seconds
- Only 1 minute of history retained to minimize memory

## Console Logging

In addition to file logging, variable changes are also logged to console when:
- Monitoring is enabled
- `logFormat` is set to "detailed"

Format: `[IP "username" in roomId] Variable "name" in room - Action: update - User: player42 (192.168.1.100)`

## Implementation Details

### Files Added
- `configuration/monitoring.json` - Configuration template
- `src/monitoringConfig.js` - Configuration loader
- `src/variableAuditLog.js` - Audit logging module

### Files Modified
- `src/server.js` - Integrated audit logging calls in `performSet()` and `performDelete()`

### Module Structure
- **VariableAuditLog class** - Main audit logging manager
  - `logChange()` - Log a variable change
  - `isSuspiciousActivity()` - Check rate limits
  - `maskValue()` - Apply value masking
  - `cleanup()` - Clean up old history entries

## Integration with Logging System

The audit logger integrates with Winston (existing logger):
- Creates separate daily-rotated log file
- Supports all Winston transport options
- Configurable retention and file rotation

## Performance Considerations

### Memory Usage
- Rate limiting history limited to 1 minute
- Automatic cleanup every 60 seconds
- Minimal overhead when logging disabled

### Disk Usage
- ~1KB per log entry (with full fields)
- 7 days retention default (~600MB for busy server)
- Configurable via `maxFiles` and `maxSize`

### CPU Impact
- Negligible when masking disabled
- Minimal pattern matching when masking enabled
- No blocking I/O (Winston handles async logging)

## Disabling Monitoring

Set `enabled: false` in either:
- `monitoring.enabled` - Disables all monitoring
- `auditLog.enabled` - Disables only file logging

Falls back to hardcoded defaults if config file is missing.

## Troubleshooting

### Logs Not Appearing
1. Check `monitoring.enabled` is true
2. Verify `auditLog.dirname` exists or is writable
3. Check console for configuration load errors

### High Disk Usage
1. Reduce `maxFiles` or `maxSize` in config
2. Disable unnecessary fields in `fields` section
3. Enable value masking with `maxValueLength`

### High Memory Usage
1. Disable rate limiting if not needed
2. Monitor history cleanup (automatic every 60s)
3. Check for unusual activity patterns
