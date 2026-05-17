#!/bin/bash
# Push updated HTML and server.js to the live server, then restart.
# Usage: bash ~/Desktop/lancer-server-setup/update.sh

set -e

STAGING="$(dirname "$0")"
HTML_SRC="/Users/chatty/Library/Mobile Documents/com~apple~CloudDocs/! Lancer Campaign/sotw_relationship_clocks.html"
SERVE_DIR="/opt/lancer-server"

echo "==> Copying updated files..."
sudo cp "$HTML_SRC"           "$SERVE_DIR/public/sotw_relationship_clocks.html"
sudo cp "$STAGING/server.js"  "$SERVE_DIR/server.js"

echo "==> Restarting lancer server..."
sudo launchctl unload /Library/LaunchDaemons/com.lancer.server.plist
sudo launchctl load   /Library/LaunchDaemons/com.lancer.server.plist

echo "Done. https://lancer.loquacity.org"
