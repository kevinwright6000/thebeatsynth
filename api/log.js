// Receives small error reports from the app and writes them to the Vercel function logs.
const kv = require('./_kv');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return kv.send(res, 405, {});
  try {
    const b = await kv.readBody(req);
    const clip = (v, n) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').slice(0, n);
    console.error('[client-error]', JSON.stringify({ m: clip(b.m, 300), s: clip(b.s, 400), w: clip(b.w, 100), u: clip(b.u, 160), v: clip(b.v, 20) }));
  } catch (e) {}
  res.statusCode = 204; res.end();
};
