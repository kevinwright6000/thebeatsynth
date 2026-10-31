// GET  /api/gallery            -> newest published beats
// POST /api/gallery {title, tags, project}  -> publish (rate limited)
// POST /api/gallery?report=<id>       -> report a beat; 3 reports hide it
// DELETE /api/gallery?id=<id> with header x-admin-key = ADMIN_KEY env -> remove
const kv = require('./_kv');
const clean = t => String(t || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
const cleanTags = t => { const a = Array.isArray(t) ? t : String(t || '').split(','); const out = []; for (const x of a) { const v = String(x).toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-').slice(0, 16); if (v && !out.includes(v)) out.push(v); if (out.length >= 4) break; } return out; };
module.exports = async (req, res) => {
  if (!kv.configured()) return kv.send(res, 503, { error: 'The gallery is not set up on this site.' });
  try {
    const q = req.query || {};
    if (req.method === 'GET') {
      const ids = await kv.cmd('LRANGE', 'gallery:ids', 0, 29), out = [];
      for (const id of ids || []) {
        const meta = await kv.cmd('GET', 'gallery:meta:' + id);
        if (!meta) continue;
        const m = JSON.parse(meta);
        if ((+(await kv.cmd('GET', 'gallery:rep:' + id)) || 0) >= 3) continue;
        out.push({ id, title: m.title, t: m.t, bpm: m.bpm, ch: m.ch, tags: m.tags || [] });
      }
      return kv.send(res, 200, out);
    }
    if (req.method === 'DELETE') {
      if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return kv.send(res, 403, { error: 'No' });
      const id = String(q.id || ''); if (!/^[\w-]{4,20}$/.test(id)) return kv.send(res, 400, { error: 'Bad id' });
      await kv.cmd('LREM', 'gallery:ids', 0, id); await kv.cmd('DEL', 'share:' + id, 'gallery:meta:' + id, 'gallery:rep:' + id);
      return kv.send(res, 200, { ok: true });
    }
    if (req.method !== 'POST') return kv.send(res, 405, { error: 'Method not allowed' });
    if (q.report) {
      const id = String(q.report); if (!/^[\w-]{4,20}$/.test(id)) return kv.send(res, 400, { error: 'Bad id' });
      if (await kv.limited('rl:rep:' + kv.ip(req), 20, 3600)) return kv.send(res, 429, { error: 'Slow down.' });
      await kv.cmd('INCR', 'gallery:rep:' + id); return kv.send(res, 200, { ok: true });
    }
    if (await kv.limited('rl:pub:' + kv.ip(req), 6, 3600)) return kv.send(res, 429, { error: 'You can publish a few beats per hour. Try again later.' });
    const body = await kv.readBody(req), title = clean(body.title);
    if (title.length < 2) return kv.send(res, 400, { error: 'Give your beat a name.' });
    const s = kv.clean(body.project), p = JSON.parse(s), id = kv.newId();
    const pat = (p.patterns && p.patterns[0]) || {};
    await kv.cmd('SET', 'share:' + id, s, 'EX', 60 * 60 * 24 * 365);
    await kv.cmd('SET', 'gallery:meta:' + id, JSON.stringify({ title, t: Date.now(), bpm: pat.bpm || 120, ch: p.channels.length, tags: cleanTags(body.tags) }), 'EX', 60 * 60 * 24 * 365);
    await kv.cmd('LPUSH', 'gallery:ids', id); await kv.cmd('LTRIM', 'gallery:ids', 0, 199);
    kv.send(res, 200, { id });
  } catch (e) { kv.send(res, 400, { error: 'Could not do that.' }); }
};
