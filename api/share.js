const kv = require('./_kv');
module.exports = async (req, res) => {
  if (!kv.configured()) return kv.send(res, 503, { error: 'Short links are not set up on this site.' });
  if (req.method !== 'POST') return kv.send(res, 405, { error: 'POST only' });
  try {
    if (await kv.limited('rl:share:' + kv.ip(req), 40, 3600)) return kv.send(res, 429, { error: 'Too many links. Try again later.' });
    const body = await kv.readBody(req), s = kv.clean(body), id = kv.newId();
    await kv.cmd('SET', 'share:' + id, s, 'EX', 60 * 60 * 24 * 365);
    kv.send(res, 200, { id });
  } catch (e) { kv.send(res, 400, { error: 'Not a Beat Synthesizer project' }); }
};
