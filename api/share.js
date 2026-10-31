const kv = require('./_kv');
module.exports = async (req, res) => {
  if (!kv.configured()) return kv.send(res, 503, { error: 'Short links are not set up on this site.' });
  if (req.method !== 'POST') return kv.send(res, 405, { error: 'POST only' });
  try {
    if (await kv.limited('rl:share:' + kv.ip(req), 40, 3600)) return kv.send(res, 429, { error: 'Too many links. Try again later.' });
    const body = await kv.readBody(req), wrapped = body && body.project && typeof body.project === 'object';
    const s = kv.clean(wrapped ? body.project : body), id = kv.newId(), ttl = 60 * 60 * 24 * 365;
    await kv.cmd('SET', 'share:' + id, s, 'EX', ttl);
    if (wrapped) {
      const m = body.meta || {}, meta = { bpm: Math.round(+m.bpm) || 0, key: String(m.key || '').slice(0, 20), ch: Math.round(+m.ch) || 0 };
      await kv.cmd('SET', 'sharemeta:' + id, JSON.stringify(meta), 'EX', ttl);
      const card = String(body.card || '');
      if (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(card) && card.length < 180000) await kv.cmd('SET', 'shareimg:' + id, card.slice(23), 'EX', ttl);
    }
    kv.send(res, 200, { id });
  } catch (e) { kv.send(res, 400, { error: 'Not a thebeatsynth project' }); }
};
