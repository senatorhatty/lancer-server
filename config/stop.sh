#!/bin/bash
# Stop the Lancer server via launchd
sudo launchctl unload /Library/LaunchDaemons/com.lancer.server.plist
echo "Lancer server stopped."
