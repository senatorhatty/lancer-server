# lancer-server

Relationship clock tracker for *Shadow of the Wolf* (Lancer RPG).

Served at **https://lancer.loquacity.org** via nginx on the same machine as `illmet-server`.

## Structure

```
lancer-server/
  server.js                        ← Node.js server (port 3001)
  public/
    sotw_relationship_clocks.html  ← the app
  config/
    lancer.conf                    ← nginx virtual host
    com.lancer.server.plist        ← launchd auto-start
    deploy.sh                      ← first-time deploy (cert + launchd)
    update.sh                      ← push changes to live server
```

## Runtime files (not in git)

| File | Purpose |
|------|---------|
| `notes.json` | Shared party notes, one per NPC |
| `gm-state.json` | Clock values, revealed rewards, hidden NPCs |

## Updating the live site

```bash
bash /opt/lancer-server/config/update.sh
```

## GM access

Visit https://lancer.loquacity.org and click **GM MODE**. Password is set in the `GM_PASSWORD` constant near the top of the HTML file.
