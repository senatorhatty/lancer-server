// Lancer Campaign Server
// Serves the relationship clocks page and persists shared NPC notes.
// No dependencies. Run: node server.js

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const NOTES_FILE = path.join(__dirname, 'notes.json');
const STATE_FILE = path.join(__dirname, 'gm-state.json');

function loadNotes() {
  try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); }
  catch { return {}; }
}
function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

function loadGMState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { clocks: {}, revealed: {}, hidden: {} }; }
}
function saveGMState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // ── API: GET /notes ───────────────────────────────────────────────────────
  if (req.method === 'GET' && url === '/notes') {
    const notes = loadNotes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(notes));
    return;
  }

  // ── API: POST /notes ──────────────────────────────────────────────────────
  if (req.method === 'POST' && url === '/notes') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { name, text } = JSON.parse(body);
        if (typeof name !== 'string') throw new Error('bad input');
        const notes = loadNotes();
        if (text) { notes[name] = text; } else { delete notes[name]; }
        saveNotes(notes);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end('Bad request');
      }
    });
    return;
  }

  // ── API: GET /gm-state ───────────────────────────────────────────────────
  if (req.method === 'GET' && url === '/gm-state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadGMState()));
    return;
  }

  // ── API: POST /gm-state ──────────────────────────────────────────────────
  if (req.method === 'POST' && url === '/gm-state') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const current = loadGMState();
        if (update.clocks)   current.clocks   = update.clocks;
        if (update.revealed) current.revealed = update.revealed;
        if (update.hidden)   current.hidden   = update.hidden;
        saveGMState(current);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end('Bad request');
      }
    });
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────────
  let filePath = path.join(PUBLIC_DIR, url === '/' ? 'sotw_relationship_clocks.html' : url);

  // Safety: don't escape the public dir
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
                   '.json':'application/json', '.png':'image/png', '.ico':'image/x-icon' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Lancer server listening on http://127.0.0.1:${PORT}`);
});
