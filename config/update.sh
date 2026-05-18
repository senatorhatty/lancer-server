#!/bin/bash
# Deploy latest code from git to the live server, then restart.
# Run from your local machine: bash config/update.sh
# Requires SSH access to chatty@aphasia.loquacity.org

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="chatty@aphasia.loquacity.org"
SERVE_DIR="/opt/lancer-server"

echo "==> Pushing local git commits..."
git -C "$REPO_ROOT" push

echo "==> Deploying to server..."
ssh "$REMOTE" bash << EOF
  set -e
  cd "$SERVE_DIR"
  sudo git pull
  sudo launchctl unload /Library/LaunchDaemons/com.lancer.server.plist
  sudo launchctl load   /Library/LaunchDaemons/com.lancer.server.plist
  sudo nginx -t && sudo nginx -s reload
  echo "Server restarted."
EOF

echo ""
echo "Done. https://lancer.loquacity.org"
