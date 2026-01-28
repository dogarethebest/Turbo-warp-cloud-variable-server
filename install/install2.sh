#!/usr/bin/env bash
set -e

echo "welcome to the TurboWarp Cloud Variable Server installer!"
echo "This script will install and configure the server on your system."
echo "Please ensure you are running this script on a fresh Ubuntu 24.04 installation."
echo "and that you have a non-root user with sudo privileges."
echo "this script will set up a firewall and basic security measures."
echo "you should not run this script if you have an existing web server or services running on this machine."
echo "the source code is available at: https://github.com/dogarethebest/Turbo-warp-cloud-variable-server"
echo "Press Ctrl+C to cancel or wait 20 seconds to continue..."
# Check for sudo privileges
if ! sudo -v >/dev/null 2>&1; then
    echo "ERROR: This script requires sudo privileges. Please run as a non-root user with sudo access."
    sleep 10
    exit 1
fi

for i in {20..1}; do
    echo "$i"
    sleep 1
done

SERVICE_NAME=turbowarp-cloud
INSTALL_DIR="$HOME/Turbo-warp-cloud-variable-server"
LOGS_DIR="$INSTALL_DIR/logs"
RUN_USER=$(whoami)

# Create logs directory
mkdir -p "$LOGS_DIR"
sudo chown syslog:adm "$LOGS_DIR"

# Installation log
INSTALL_LOG="$LOGS_DIR/install.log"
exec > >(tee -a "$INSTALL_LOG") 2>&1

echo "==> Updating system"
sudo apt update

echo "==> Installing dependencies"
sudo apt install -y curl git ufw

echo "==> Installing Node.js 18"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "==> Cloning repository"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
git clone https://github.com/dogarethebest/Turbo-warp-cloud-variable-server.git "$INSTALL_DIR"

cd "$INSTALL_DIR"

echo "==> Installing npm dependencies"
npm install --omit=dev

echo "==> Creating systemd service"
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=TurboWarp Cloud Variable Server
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$INSTALL_DIR
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=append:$LOGS_DIR/server.log
StandardError=append:$LOGS_DIR/error.log
ProtectSystem=full
NoNewPrivileges=true
PrivateTmp=true
ExecStart=/usr/bin/npm start -- --hostname 127.0.0.1
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

mkdir -p "$UFW_LOG_DIR"
sudo chown syslog:adm "$UFW_LOG_DIR"
sudo chmod 750 "$UFW_LOG_DIR"

RSYSLOG_CONF="/etc/rsyslog.d/20-ufw-custom.conf"
sudo tee "$RSYSLOG_CONF" > /dev/null <<EOF
:msg, contains, "[UFW " -$UFW_LOG_FILE
& stop
EOF

sudo systemctl restart rsyslog

echo "==> Starting TurboWarp service"
sudo systemctl start $SERVICE_NAME

echo "==> Done!"
echo "Installation log: $INSTALL_LOG"
echo "Application logs: $LOGS_DIR/server.log"
systemctl status $SERVICE_NAME --no-pager
