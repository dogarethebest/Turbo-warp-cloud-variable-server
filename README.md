# Turbo Warp Cloud Variable Server

A fork of the [TurboWarp cloud-server](https://github.com/TurboWarp/cloud-server) designed for production environments 


### Comprehensive Audit Logging
- Logs every variable create, update, and delete operation
- Records IP addresses, usernames, timestamps, and old/new values
- Stores logs in daily-rotated files with JSON format
- Includes user agent and client count information

### Flexible Configuration
- **monitoring.json** - Control what gets logged and when
- **room.json** - Set capacity limits and cleanup policies
- All settings are optional with sensible defaults
- Easy on/off toggles for different features


## Quick Start

### Installation
you can use the doctor file in the release or you can use
#### Automated Setup 
For fresh Ubuntu 24.04 installations with a non-root user:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/dogarethebest/Turbo-warp-cloud-variable-server/release/install.sh)"
```



**What the installer does:**
- Updates system packages
- Installs Node.js 18, Git, and curl
- Clones the repository
- Installs npm dependencies
- Creates systemd service for auto-start
- Configures UFW firewall (allows port 8090)
- Sets up fail2ban for SSH protection
- Configures rsyslog for UFW logging
- Starts the service automatically

**Requirements:**
- Fresh Ubuntu 24.04 system
- Non-root user with sudo privileges
- No existing web servers on the machine

**Output locations after install:**
- Installation log: `~/Turbo-warp-cloud-variable-server/logs/install.log`
- Server logs: `~/Turbo-warp-cloud-variable-server/logs/server.log`
- Error logs: `~/Turbo-warp-cloud-variable-server/logs/error.log`
- UFW logs: `~/Turbo-warp-cloud-variable-server/logs/ufw/ufw.log`

#### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm test

# 3. Start server
npm start
```

Server runs on port 9080 by default (or 127.0.0.1:8090 in systemd mode).

## Configuration Files

### `configuration/monitoring.json`
Control audit logging behavior:
- Enable/disable monitoring
- Choose which fields to log
- Set rate limits
- Configure value masking

### `configuration/room.json`
Set server capacity:
- Max rooms: 16,384
- Max clients per room: 128
- Max variables per room: 128
- Janitor cleanup intervals

**Both files have inline comments explaining each setting.**

## Audit Logs

Logs are stored in `logs/variable-audit.YYYY-MM-DD.log` as JSON:

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

See [MONITORING_README.md](configuration/MONITORING_README.md) for detailed documentation.

## 🛠️ Testing with Turbo Warp

1. **Start the server:**
   ```bash
   npm start
   ```

2. **In Turbo Warp, set cloud host:**
   ```
   ws://localhost:9080
   ```

3. **Create cloud variables and change them**

4. **Monitor logs in real-time:**
   ```bash
   tail -f logs/variable-audit.$(date +%Y-%m-%d).log
   ```

## About This Project

I'm **new to coding** and created this as a learning project to better understand:
- Node.js and WebSocket servers
- Configuration management
- Audit logging systems
- Rate limiting algorithms

## Contributing

**Contributions are welcome!** Whether you're experienced or just learning, your help is appreciated.

### Ways to Contribute:
- **Report bugs** - Found an issue? Let us know
- **Suggest features** - Have an idea? Open an issue
- **Improve documentation** - Help explain how things work
- **Write tests** - Add more test coverage
- **Fix issues** - Submit pull requests
- **Code review** - Help review other contributions

### Getting Started:
1. Fork the repository
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Submit a pull request


## License

MIT License - Same as TurboWarp cloud-server

##  Acknowledgments

- Original [TurboWarp cloud-server](https://github.com/TurboWarp/cloud-server)
- TurboWarp team and community


