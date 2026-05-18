// Lancer Campaign Server
// Serves the relationship clocks page and persists all game state server-side.
// No dependencies beyond Node.js built-ins. Run: node server.js

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATE_FILE = path.join(__dirname, 'gm-state.json');
const NOTES_FILE = path.join(__dirname, 'notes.json'); // legacy — migrated on first load

// ── SSE broadcast ─────────────────────────────────────────────────────────
const clients = new Set();

function broadcast() {
  const dead = [];
  clients.forEach(res => {
    try { res.write('data: update\n\n'); }
    catch { dead.push(res); }
  });
  dead.forEach(r => clients.delete(r));
}

// ── State ─────────────────────────────────────────────────────────────────
function loadState() {
  let state = { clocks: {}, revealed: {}, hidden: {}, notes: {}, sections: [] };
  try { Object.assign(state, JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); } catch {}
  // Migrate legacy notes.json if notes key is missing
  if (!state.notes || Object.keys(state.notes).length === 0) {
    try { state.notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')); } catch {}
  }
  return state;
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  broadcast();
}

// ── Helpers ───────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

// ── Request handler ───────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  setCORS(res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── SSE: GET /events ──────────────────────────────────────────────────
  if (req.method === 'GET' && url === '/events') {
    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',          // tell nginx not to buffer SSE
    });
    res.write('data: connected\n\n');
    clients.add(res);
    // 30-second ping keeps the connection alive through proxies
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); }
      catch { clearInterval(ping); clients.delete(res); }
    }, 30000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  // ── GET /gamestate ────────────────────────────────────────────────────
  if (req.method === 'GET' && url === '/gamestate') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadState()));
    return;
  }

  // ── POST /gamestate ───────────────────────────────────────────────────
  // Accepts a partial patch — merges each present key into saved state.
  // { clocks, revealed, hidden, notes } are deep-merged (key by key).
  // { sections } replaces the whole array.
  if (req.method === 'POST' && url === '/gamestate') {
    try {
      const patch   = await readBody(req);
      const current = loadState();
      if (patch.clocks)   Object.assign(current.clocks,   patch.clocks);
      if (patch.revealed) Object.assign(current.revealed, patch.revealed);
      if (patch.hidden)   Object.assign(current.hidden,   patch.hidden);
      if (patch.notes)    Object.assign(current.notes,    patch.notes);
      if (patch.sections) current.sections = patch.sections;
      saveState(current);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400); res.end('Bad request');
    }
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────
  let filePath = path.join(PUBLIC_DIR, url === '/' ? 'sotw_relationship_clocks.html' : url);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const mime = {
      '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
      '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon',
    };
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Lancer server listening on http://127.0.0.1:${PORT}`);
});
