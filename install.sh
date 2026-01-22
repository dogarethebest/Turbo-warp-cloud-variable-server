#!/usr/bin/env bash
set -e

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
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=append:$LOGS_DIR/server.log
StandardError=append:$LOGS_DIR/error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

echo "==> Installing & configuring UFW firewall"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp
sudo ufw allow 8090/tcp
sudo ufw logging high
sudo ufw --force enable

# Firewall custom logs
UFW_LOG_DIR="$LOGS_DIR/ufw"
UFW_LOG_FILE="$UFW_LOG_DIR/ufw.log"

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
echo "UFW logs: $UFW_LOG_FILE"
systemctl status $SERVICE_NAME --no-pager