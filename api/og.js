// Serves the preview image for a shared beat: /api/og?id=XXXX. Falls back to the site image.
const kv = require('./_kv');
module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  try {
    if (kv.configured() && /^[\w-]{4,20}$/.test(id)) {
      const b = await kv.cmd('GET', 'shareimg:' + id);
      if (b) {
        res.statusCode = 200; res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        return res.end(Buffer.from(b, 'base64'));
      }
    }
  } catch (e) {}
  res.statusCode = 302; res.setHeader('Location', '/og.png'); res.end();
};
