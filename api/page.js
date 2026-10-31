// Serves the app page with per-share Open Graph tags so a shared link previews well in chats and social.
// vercel.json rewrites "/?s=ID" here. Any failure falls back to the plain page.
const kv = require('./_kv');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
exports.inject = (html, origin, id, meta) => {
  const bits = [meta.bpm ? meta.bpm + ' BPM' : '', meta.key || '', meta.ch ? meta.ch + ' channels' : ''].filter(Boolean).join(' · ');
  const title = 'A beat on thebeatsynth', desc = (bits ? bits + '. ' : '') + 'Open it, press play and remix it in your browser. Free.';
  const img = origin + '/api/og?id=' + encodeURIComponent(id), url = origin + '/?s=' + encodeURIComponent(id);
  const tags = '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:type" content="website"><meta property="og:url" content="' + esc(url) + '"><meta property="og:image" content="' + esc(img) + '"><meta property="og:image:width" content="600"><meta property="og:image:height" content="315"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(img) + '">';
  return html.replace(/<meta property="og:[^>]*>|<meta name="twitter:[^>]*>/g, '').replace('</head>', tags + '</head>');
};
exports.handler = async (req, res) => {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0], origin = proto + '://' + req.headers.host;
  let html;
  try { html = await (await fetch(origin + '/index.html')).text(); } catch (e) { res.statusCode = 302; res.setHeader('Location', '/index.html?s=' + encodeURIComponent(req.query.s || '')); return res.end(); }
  try {
    const id = String(req.query.s || '');
    if (kv.configured() && /^[\w-]{4,20}$/.test(id)) {
      const m = await kv.cmd('GET', 'sharemeta:' + id);
      html = exports.inject(html, origin, id, m ? JSON.parse(m) : {});
    }
  } catch (e) {}
  res.statusCode = 200; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.end(html);
};
module.exports = exports.handler;
module.exports.inject = exports.inject;
