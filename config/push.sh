#!/bin/bash
# Commit and push everything in /opt/lancer-server to GitHub.
# Usage: bash /opt/lancer-server/config/push.sh "your commit message"

set -e
REPO="/opt/lancer-server"
MSG="${1:-Update}"

TOKEN=$(git credential-osxkeychain get <<< $'protocol=https\nhost=github.com\n' 2>/dev/null | grep password | cut -d= -f2)
if [ -z "$TOKEN" ]; then
  echo "No GitHub token found in keychain. Run: git credential-osxkeychain store"
  exit 1
fi

git -C "$REPO" add .

if git -C "$REPO" diff --cached --quiet; then
  echo "Nothing to commit."
  exit 0
fi

git -C "$REPO" commit -m "$MSG"
git -C "$REPO" -c credential.helper="" \
  -c "url.https://senatorhatty:${TOKEN}@github.com.insteadOf=https://github.com" \
  push

echo "Pushed to https://github.com/senatorhatty/lancer-server"
