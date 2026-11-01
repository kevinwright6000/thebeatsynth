const V='beats-1793566871',CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-180.png','icon-192.png','icon-512.png','lame.min.js','fonts/jetbrains-mono-latin-500-normal.woff2','fonts/jetbrains-mono-latin-700-normal.woff2','fonts/rajdhani-latin-500-normal.woff2','fonts/rajdhani-latin-600-normal.woff2','fonts/rajdhani-latin-700-normal.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.pathname.indexOf('/api/')===0||u.pathname.indexOf('/_vercel/')===0)return;
  const ok=u.origin===location.origin||/(fonts\.(googleapis|gstatic)\.com|gleitz\.github\.io|cdn\.jsdelivr\.net)$/.test(u.hostname);if(!ok)return;
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;}).catch(()=>hit);
    return hit||net;
  }));
});
