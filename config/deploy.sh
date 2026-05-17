#!/bin/bash
# Lancer server full deploy.
# Run once after DNS has propagated, or re-run to update.
# Usage: bash ~/Desktop/lancer-server-setup/deploy.sh

set -e

STAGING="$(dirname "$0")"
HTML_SRC="/Users/chatty/Library/Mobile Documents/com~apple~CloudDocs/! Lancer Campaign/sotw_relationship_clocks.html"
SERVE_DIR="/opt/lancer-server"
PUBLIC_DIR="$SERVE_DIR/public"
NGINX_CONF="/opt/homebrew/etc/nginx/servers/lancer.conf"
PLIST="/Library/LaunchDaemons/com.lancer.server.plist"
DOMAIN="lancer.loquacity.org"

echo "==> Creating directories..."
sudo mkdir -p "$PUBLIC_DIR"

echo "==> Copying files..."
sudo cp "$HTML_SRC"           "$PUBLIC_DIR/sotw_relationship_clocks.html"
sudo cp "$STAGING/server.js"  "$SERVE_DIR/server.js"

echo "==> Installing nginx config..."
sudo cp "$STAGING/lancer.conf" "$NGINX_CONF"

# First deploy only: get the cert with a temporary static config
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "==> No cert found — installing temporary HTTP config for certbot..."
  sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $PUBLIC_DIR;
    location / { try_files \$uri \$uri/ =404; }
}
EOF
  sudo nginx -t && sudo nginx -s reload
  echo "==> Obtaining Let's Encrypt certificate..."
  sudo certbot certonly --webroot -w "$PUBLIC_DIR" -d "$DOMAIN"
  echo "==> Reinstalling full nginx config..."
  sudo cp "$STAGING/lancer.conf" "$NGINX_CONF"
fi

echo "==> Testing nginx config..."
sudo nginx -t

echo "==> Installing launchd plist..."
sudo cp "$STAGING/com.lancer.server.plist" "$PLIST"

echo "==> Starting/restarting lancer server..."
sudo launchctl unload "$PLIST" 2>/dev/null || true
sudo launchctl load "$PLIST"

echo "==> Reloading nginx..."
sudo nginx -s reload

echo ""
echo "Done! https://$DOMAIN"
echo "Logs: tail -f /tmp/lancer-server.log"
