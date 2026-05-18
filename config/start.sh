#!/bin/bash
# Start the Lancer server via launchd
sudo launchctl load /Library/LaunchDaemons/com.lancer.server.plist
echo "Lancer server started."
echo "Logs: tail -f /tmp/lancer-server.log"
