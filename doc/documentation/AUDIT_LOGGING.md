# Variable Audit Logging Implementation

## Overview
The variable audit logging system logs all variable changes in the cloud variable server, tracking who made changes, what changed, when, and from where. This is essential for compliance, security monitoring, and debugging.

## Architecture

### Components

1. **VariableAuditLog** (`src/variableAuditLog.js`)
   - Singleton instance that manages all audit logging
   - Uses Winston logger with daily rotating files
   - Tracks rate limiting and suspicious activity
   - Configurable via `configuration/monitoring.json`

2. **Room** (`src/Room.js`)
   - Modified to call audit logger when variables are changed
   - Methods: `create()`, `set()`, `delete()`
   - Passes client information and metadata

3. **Monitoring Configuration** (`configuration/monitoring.json`)
   - Master control for all logging behavior
   - Configurable field inclusion/exclusion
   - Rate limiting and suspicious activity detection
   - Value masking for sensitive data

## Audit Log Data

Each audit log entry contains:

```json
{
  "timestamp": "2026-01-18T21:14:09.699Z",
  "ip": "192.168.1.100",
  "username": "player123",
  "roomId": "game-session-456",
  "variableName": "☁ score",
  "oldValue": "100",
  "newValue": "250",
  "userAgent": "Mozilla/5.0...",
  "action": "update",
  "clientCount": 4,
  "valueType": "string"
}
```

### Log Actions

- **create**: Variable created for the first time
- **update**: Existing variable value changed
- **delete**: Variable removed from room
- **suspicious**: Flag added when suspicious activity detected

## Configuration

### Enable/Disable Audit Logging

Edit `configuration/monitoring.json`:

```json
{
  "monitoring": {
    "enabled": true,
    "logVariableChanges": true
  },
  "auditLog": {
    "enabled": true
  }
}
```

### Configure Log Rotation

```json
{
  "auditLog": {
    "dirname": "logs",
    "filename": "variable-audit.log",
    "datePattern": "YYYY-MM-DD",
    "maxFiles": "7d",
    "maxSize": "100m",
    "createSymlink": true
  }
}
```

- **dirname**: Directory where logs are stored (creates if needed)
- **filename**: Base name for log files (date appended)
- **datePattern**: Creates new file each matching period (YYYY-MM-DD = daily)
- **maxFiles**: Automatically delete logs older than N days
- **maxSize**: Rotate when file reaches N megabytes
- **createSymlink**: Creates `variable-audit.log` symlink to latest

### Select Fields to Log

```json
{
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
  }
}
```

Set individual fields to `false` to exclude them from logs.

### Rate Limiting & Suspicious Activity

```json
{
  "limits": {
    "enableRateLimiting": false,
    "maxChangesPerSecondPerClient": 100,
    "maxChangesPerMinutePerVariable": 1000,
    "logSuspiciousActivity": true,
    "suspiciousThreshold": 50
  }
}
```

- **enableRateLimiting**: Enable/disable rate limit checking
- **maxChangesPerSecondPerClient**: Alert if client exceeds this per second
- **maxChangesPerMinutePerVariable**: Alert if variable changed more than this per minute
- **logSuspiciousActivity**: Mark entries as "suspicious" when limits exceeded

### Value Masking

```json
{
  "valueMasking": {
    "enabled": false,
    "maskLongValues": true,
    "maxValueLength": 100,
    "maskSensitivePatterns": false
  }
}
```

- **enabled**: Enable value masking
- **maskLongValues**: Truncate values longer than maxValueLength
- **maxValueLength**: Maximum length before truncation
- **maskSensitivePatterns**: Mask patterns like passwords, emails, etc.

## Using the Audit Log

### Creating a Variable with Audit Logging

Pass a client object as the third parameter:

```javascript
const room = new Room('my-room');

// Client object with required properties
const client = {
  ip: '192.168.1.1',
  username: 'player1',
  userAgent: 'Mozilla/5.0...',
  room: { id: 'my-room' }
};

// Create variable - will be logged
room.create('☁ score', '0', client);
```

### Updating a Variable with Audit Logging

```javascript
// Update variable - logs old and new values
room.set('☁ score', '100', client);
```

### Deleting a Variable with Audit Logging

```javascript
// Delete variable - logs old value and that it was deleted
room.delete('☁ score', client);
```

### Without Client (No Logging)

```javascript
// These don't log (for internal operations)
room.create('☁ internal', '0');
room.set('☁ internal', '10');
room.delete('☁ internal');
```

## Log File Locations

Logs are stored in the `logs/` directory:

```
logs/
├── variable-audit.log          # Symlink to current day's log
├── variable-audit.log.2026-01-18  # Daily log file
└── variable-audit.log.2026-01-17  # Previous day's log
```

### Log Format

Log files are **JSON Lines** format (one JSON object per line):

```
{"timestamp":"2026-01-18T21:14:09.699Z","ip":"192.168.1.100","username":"player1","roomId":"game-1","variableName":"☁ score","oldValue":"0","newValue":"100","userAgent":"Browser","action":"update","clientCount":3,"valueType":"string"}
{"timestamp":"2026-01-18T21:14:10.102Z","ip":"192.168.1.100","username":"player1","roomId":"game-1","variableName":"☁ score","oldValue":"100","newValue":"150","userAgent":"Browser","action":"update","clientCount":3,"valueType":"string","suspicious":true,"alert":"Suspicious activity detected - possible rate limit exceeded"}
```

## Querying Audit Logs

### Find all changes to a specific variable

```bash
grep "☁ score" logs/variable-audit.log | jq .
```

### Find all changes by a specific user

```bash
grep "player1" logs/variable-audit.log | jq .
```

### Find suspicious activity

```bash
grep "suspicious" logs/variable-audit.log | jq .
```

### Find all updates in a room

```bash
grep "game-1" logs/variable-audit.log | grep "update" | jq .
```

### Parse and analyze logs

```javascript
const fs = require('fs');
const logFile = 'logs/variable-audit.log';
const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l);
const entries = lines.map(l => JSON.parse(l));

// Group by user
const byUser = {};
entries.forEach(e => {
  byUser[e.username] = (byUser[e.username] || 0) + 1;
});
console.log('Changes by user:', byUser);
```

## Integration Points

### Server Initialization

When handling variable operations in `server.js` or connection handlers:

```javascript
const Client = require('./Client');
const Room = require('./Room');

// When a client creates/updates/deletes a variable:
client.room.create('☁ varname', 'value', client);
client.room.set('☁ varname', 'newvalue', client);
client.room.delete('☁ varname', client);
```

### Client Properties Required

The client object passed to Room methods must have:

```javascript
{
  ip: '192.168.1.1',           // Client's IP address
  username: 'username',        // Client's username (can be 'unknown')
  userAgent: 'Mozilla/5.0...', // Browser user agent (optional)
  room: { id: 'room-id' }      // Reference to room with id property
}
```

## Performance Considerations

- **Logging overhead**: ~0.1-0.2ms per operation
- **Disk I/O**: Handled asynchronously by Winston
- **Memory**: Change history kept for 1 minute for rate limiting (auto-cleaned)
- **Log size**: ~500-1000 bytes per entry
- **Rotation**: Automatic daily rotation prevents unbounded growth

## Security Notes

1. **Client IP**: Captures client's IP address for tracking
2. **Rate Limiting**: Detects potential abuse patterns
3. **Value Masking**: Optional masking for sensitive data
4. **Suspicious Flags**: Automatic flagging of abnormal activity
5. **File Permissions**: Ensure logs are protected with appropriate file permissions:
   ```bash
   chmod 600 logs/variable-audit.log*
   ```

## Troubleshooting

### Logs not appearing

1. Check `configuration/monitoring.json`:
   - `monitoring.enabled` = `true`
   - `auditLog.enabled` = `true`

2. Verify logs directory exists:
   ```bash
   ls -la logs/
   ```

3. Check that client is passed to Room methods:
   ```javascript
   room.create('☁ var', 'value', client); // ✓ with client
   room.create('☁ var', 'value');         // ✗ no logging
   ```

### Logs file permissions

If Winston can't write logs:

```bash
chmod 755 logs/
chmod 644 logs/variable-audit.log*
```

### High disk usage

- Reduce `maxSize` in config to rotate more frequently
- Reduce `maxFiles` to delete logs sooner
- Enable value masking to reduce data size

## Example: Complete Audit Trail

```json
{
  "timestamp": "2026-01-18T21:14:09.699Z",
  "ip": "192.168.1.100",
  "username": "player1",
  "roomId": "game-session-123",
  "variableName": "☁ player_score",
  "action": "create",
  "newValue": "0",
  "userAgent": "Scratch Client v3.0",
  "clientCount": 1,
  "valueType": "string"
}
```

This entry shows:
- When: 2026-01-18 at 21:14:09 UTC
- Who: `player1` from IP 192.168.1.100
- Where: `game-session-123` room
- What: Created `☁ player_score` with value `0`
- How: Using Scratch Client v3.0
- Context: 1 client in room at time of change
