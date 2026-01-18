# Audit Logging Integration Examples

## Example 1: WebSocket Integration

In a WebSocket/connection handler, pass client information to Room methods:

```javascript
function handleClientConnection(socket, clientIP, clientUsername, userAgent) {
  // Create a client object with audit logging properties
  const client = {
    ip: clientIP,
    username: clientUsername,
    userAgent: userAgent,
    room: null
  };

  // When client joins a room
  socket.on('join_room', (roomId) => {
    const room = roomList.create(roomId);
    room.addClient(client);
    client.room = room;
  });

  // When creating a variable - PASS CLIENT
  socket.on('create_variable', (varName, value) => {
    try {
      client.room.create(varName, String(value), client);  // ← Pass client
      socket.emit('variable_created', { name: varName, value });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // When updating a variable - PASS CLIENT
  socket.on('set_variable', (varName, value) => {
    try {
      client.room.set(varName, String(value), client);  // ← Pass client
      socket.emit('variable_updated', { name: varName, value });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // When deleting a variable - PASS CLIENT
  socket.on('delete_variable', (varName) => {
    try {
      client.room.delete(varName, client);  // ← Pass client
      socket.emit('variable_deleted', { name: varName });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
}
```

## Example 2: REST API Integration

```javascript
const express = require('express');
const app = express();

// Create variable
app.post('/api/rooms/:roomId/variables', (req, res) => {
  const { roomId } = req.params;
  const { name, value } = req.body;

  const client = {
    ip: req.ip,
    username: req.user?.username || 'unknown',
    userAgent: req.get('user-agent'),
    room: { id: roomId }
  };

  try {
    const room = roomList.create(roomId);
    room.create(name, String(value), client);  // ← Pass client
    res.json({ success: true, variable: { name, value } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update variable
app.put('/api/rooms/:roomId/variables/:varName', (req, res) => {
  const { roomId, varName } = req.params;
  const { value } = req.body;

  const client = {
    ip: req.ip,
    username: req.user?.username || 'unknown',
    userAgent: req.get('user-agent'),
    room: { id: roomId }
  };

  try {
    const room = roomList.get(roomId);
    room.set(varName, String(value), client);  // ← Pass client
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete variable
app.delete('/api/rooms/:roomId/variables/:varName', (req, res) => {
  const { roomId, varName } = req.params;

  const client = {
    ip: req.ip,
    username: req.user?.username || 'unknown',
    userAgent: req.get('user-agent'),
    room: { id: roomId }
  };

  try {
    const room = roomList.get(roomId);
    room.delete(varName, client);  // ← Pass client
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Example 3: Analyzing Audit Logs for a User

```javascript
const fs = require('fs');
const readline = require('readline');

async function analyzeAuditLogs(username) {
  const logFile = 'logs/variable-audit.log';
  
  if (!fs.existsSync(logFile)) {
    console.log('No audit logs found');
    return;
  }

  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log(`\n=== Audit Log Entries for User: ${username} ===\n`);

  for await (const line of rl) {
    const entry = JSON.parse(line);
    
    if (entry.username === username) {
      console.log(`[${entry.timestamp}] ${entry.action.toUpperCase()}`);
      console.log(`  Variable: ${entry.variableName}`);
      console.log(`  Old Value: ${entry.oldValue}`);
      console.log(`  New Value: ${entry.newValue}`);
      console.log(`  Room: ${entry.roomId}`);
      console.log(`  IP: ${entry.ip}`);
      console.log('');
    }
  }
}

// Usage: analyzeAuditLogs('player1');
```

## Example 4: Finding Suspicious Activity

```javascript
async function findSuspiciousActivity() {
  const logFile = 'logs/variable-audit.log';

  if (!fs.existsSync(logFile)) {
    console.log('No audit logs found');
    return;
  }

  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('\n=== Suspicious Activity Detected ===\n');
  let count = 0;

  for await (const line of rl) {
    const entry = JSON.parse(line);
    
    if (entry.suspicious) {
      console.log(`[${entry.timestamp}] ${entry.alert}`);
      console.log(`  User: ${entry.username} (${entry.ip})`);
      console.log(`  Variable: ${entry.variableName}`);
      console.log(`  Room: ${entry.roomId}`);
      console.log('');
      count++;
    }
  }

  if (count === 0) {
    console.log('No suspicious activity detected');
  }
}

// Usage: findSuspiciousActivity();
```

## Example 5: Audit Log Statistics

```javascript
async function getAuditStatistics() {
  const logFile = 'logs/variable-audit.log';

  if (!fs.existsSync(logFile)) {
    console.log('No audit logs found');
    return;
  }

  const stats = {
    totalEntries: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
    userCount: new Set(),
    roomCount: new Set(),
    suspicious: 0
  };

  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const entry = JSON.parse(line);
    
    stats.totalEntries++;
    if (entry.action === 'create') stats.creates++;
    else if (entry.action === 'update') stats.updates++;
    else if (entry.action === 'delete') stats.deletes++;
    
    stats.userCount.add(entry.username);
    stats.roomCount.add(entry.roomId);
    if (entry.suspicious) stats.suspicious++;
  }

  console.log('\n=== Audit Log Statistics ===\n');
  console.log(`Total Entries: ${stats.totalEntries}`);
  console.log(`  Creates: ${stats.creates}`);
  console.log(`  Updates: ${stats.updates}`);
  console.log(`  Deletes: ${stats.deletes}`);
  console.log(`Unique Users: ${stats.userCount.size}`);
  console.log(`Unique Rooms: ${stats.roomCount.size}`);
  console.log(`Suspicious Activities: ${stats.suspicious}`);
  console.log('');
}

// Usage: getAuditStatistics();
```

## Example 6: Finding All Changes to a Specific Variable

```bash
# Find all changes to a variable
grep "☁ score" logs/variable-audit.log | jq .

# Find changes to a variable in a specific room
grep "☁ score" logs/variable-audit.log | grep "game-1" | jq .
```

## Example 7: JSON Query Examples

```bash
# All updates (not creates or deletes)
grep "update" logs/variable-audit.log | jq .

# All deletions
grep "delete" logs/variable-audit.log | jq .

# All changes by a user
grep "player1" logs/variable-audit.log | jq .

# All suspicious activities
grep "suspicious" logs/variable-audit.log | jq .

# Changes in a specific room
grep "game-session-123" logs/variable-audit.log | jq .
```

## Key Points

1. **Always pass the client object** to `create()`, `set()`, and `delete()` methods for logging
2. **Client must have** `ip`, `username`, `userAgent`, and `room` properties
3. **Logs are in JSON Lines format** - each line is a complete JSON object
4. **Log file rotates daily** - check `logs/variable-audit.log.YYYY-MM-DD`
5. **Use `jq` command line tool** for easy JSON parsing and filtering

## Client Object Requirements

```javascript
const client = {
  ip: '192.168.1.1',              // Required: Client IP address
  username: 'player1',            // Required: Client username
  userAgent: 'Mozilla/5.0...',    // Optional: Browser user agent
  room: { id: 'game-1' }          // Required: Room reference with id
};

// Pass to Room methods
room.create('☁ var', 'value', client);
room.set('☁ var', 'newvalue', client);
room.delete('☁ var', client);
```
