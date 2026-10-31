// Optional share server for Beat Synthesizer. No dependencies. Node 16 or newer.
//   node server/server.js            (serves the site one folder up, and the /api/share endpoints)
//   PORT=8080 HOST=0.0.0.0 node server/server.js
// Short links look like  https://your-site/?s=Ab3dE
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), DATA = path.join(__dirname, 'shares');
const PORT = +process.env.PORT || 8080, HOST = process.env.HOST || '127.0.0.1';
const MAX_BYTES = 2 * 1024 * 1024, PER_HOUR = 40;
fs.mkdirSync(DATA, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain' };
const hits = new Map();
const limited = ip => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 3600e3); a.push(now); hits.set(ip, a); return a.length > PER_HOUR; };
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }); res.end(body); };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api/share') {
    const ip = req.socket.remoteAddress || '';
    if (limited(ip)) return send(res, 429, '{"error":"Too many links. Try again later."}');
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > MAX_BYTES) { send(res, 413, '{"error":"Too large"}'); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (res.writableEnded) return;
      try {
        const p = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!p || !Array.isArray(p.channels)) throw 0;
        p.channels.forEach(c => { delete c.audio; });            // never store audio
        const id = crypto.randomBytes(5).toString('base64url');
        fs.writeFileSync(path.join(DATA, id + '.json'), JSON.stringify(p));
        send(res, 200, JSON.stringify({ id }));
      } catch (e) { send(res, 400, '{"error":"Not a Beat Synthesizer project"}'); }
    });
    return;
  }
  const m = /^\/api\/share\/([\w-]{4,20})$/.exec(url.pathname);
  if (req.method === 'GET' && m) {
    const f = path.join(DATA, m[1] + '.json');
    return fs.existsSync(f) ? send(res, 200, fs.readFileSync(f)) : send(res, 404, '{"error":"Not found"}');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, '{}');
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
  const f = path.resolve(ROOT, '.' + rel);
  if (!f.startsWith(ROOT + path.sep) || f.startsWith(__dirname)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(f, (e, d) => e ? send(res, 404, 'Not found', 'text/plain') : send(res, 200, d, MIME[path.extname(f)] || 'application/octet-stream'));
}).listen(PORT, HOST, () => console.log('Beat Synthesizer on http://' + HOST + ':' + PORT));
