const kv = require('../_kv');
module.exports = async (req, res) => {
  if (!kv.configured()) return kv.send(res, 503, { error: 'Short links are not set up on this site.' });
  const id = String(req.query.id || '');
  if (!/^[\w-]{4,20}$/.test(id)) return kv.send(res, 400, { error: 'Bad id' });
  const v = await kv.cmd('GET', 'share:' + id);
  if (!v) return kv.send(res, 404, { error: 'Not found' });
  kv.send(res, 200, v);
};
