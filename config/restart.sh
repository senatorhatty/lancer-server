#!/bin/bash
# Restart the Lancer server via launchd
sudo launchctl unload /Library/LaunchDaemons/com.lancer.server.plist
sudo launchctl load   /Library/LaunchDaemons/com.lancer.server.plist
echo "Lancer server restarted."
echo "Logs: tail -f /tmp/lancer-server.log"
