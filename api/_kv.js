// Minimal Upstash/Vercel KV REST client (no dependencies).
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash integration) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
exports.configured = () => !!(URL_() && TOKEN());
exports.cmd = async (...args) => {
  const r = await fetch(URL_(), { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN(), 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
exports.ip = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
// Allow at most `max` calls per `secs` per key. Returns true when over the limit.
exports.limited = async (key, max, secs) => {
  const n = await exports.cmd('INCR', key);
  if (n === 1) await exports.cmd('EXPIRE', key, secs);
  return n > max;
};
exports.send = (res, code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store'); res.end(typeof obj === 'string' ? obj : JSON.stringify(obj)); };
exports.readBody = async req => {
  if (req.body !== undefined && req.body !== null && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = []; let n = 0;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  for await (const c of req) { n += c.length; if (n > 600 * 1024) throw new Error('too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
// Accept only something that looks like a thebeatsynth project, and strip embedded audio.
exports.clean = p => {
  if (!p || typeof p !== 'object' || !Array.isArray(p.channels) || p.channels.length > 40) throw new Error('bad project');
  p.channels.forEach(c => { delete c.audio; });
  const s = JSON.stringify(p);
  if (s.length > 400 * 1024) throw new Error('too large');
  return s;
};
exports.newId = () => require('crypto').randomBytes(5).toString('base64url');
