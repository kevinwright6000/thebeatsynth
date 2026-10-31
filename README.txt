thebeatsynth - deploy notes

STATIC HOSTING (any host, no server code)
  Upload everything in this folder except "server/" to your web root:
  index.html, sw.js, manifest.webmanifest, icon.svg, lame.min.js
  Serve over HTTPS (needed for the microphone, MIDI and installing as an app).
  If you set a Content-Security-Policy, allow fonts.googleapis.com and fonts.gstatic.com (styles, fonts), blob: and data: (audio, downloads).
  Do not block the "microphone" Permissions-Policy; iframes need allow="microphone; midi".

OPTIONAL SHARE SERVER (short links like /?s=Ab3dE)
  Needs Node 16+. From this folder:  node server/server.js
  It serves the site and two endpoints: POST /api/share and GET /api/share/<id>.
  Shares are stored as small JSON files in server/shares/. Audio you imported is never stored.
  Put it behind your usual reverse proxy for HTTPS. Without the server, the app's "Short link" button
  shows a message and "Create link" (long link, no server) still works.

UPDATING
  sw.js caches the app. When you replace index.html, change the version string at the top of sw.js
  (const V='beats-...') so visitors get the new version.


---- Short links, gallery, analytics (Vercel) ----
1. Vercel dashboard > Storage > Create > Upstash for Redis (or KV). Connect it to this project.
   That sets KV_REST_API_URL and KV_REST_API_TOKEN. Redeploy once.
2. Optional: add env var ADMIN_KEY. Remove a gallery beat with:
   curl -X DELETE -H "x-admin-key: YOUR_KEY" "https://YOURSITE/api/gallery?id=BEATID"
3. Analytics: Vercel dashboard > Analytics > Enable. The script is already in index.html.
4. Errors from visitors' browsers are logged by /api/log (Vercel > Logs, search "client-error").
Without step 1, "Short link" and the gallery show a friendly "not set up" message; everything else works.

---- Tests ----
GitHub Actions runs tests/ on every push (.github/workflows/test.yml).
Locally: cd tests && npm install && npx playwright install chromium && npm test

---- Real instruments ----
The "Real instruments" button loads single instruments on demand from the midi-js-soundfonts project (FluidR3_GM, Creative Commons BY 3.0)
at https://gleitz.github.io/midi-js-soundfonts/. Keep the credit shown in that window. The service worker caches them after the first load.

Sound sets: the Real instruments window uses FluidR3_GM (CC BY 3.0) from midi-js-soundfonts.
Salamander Grand Piano V3 by Alexander Holm (CC BY 3.0) is self-hosted in sounds/salamander/ (30 mp3 files, about 2 MB). Keep LICENSE.txt with them.
If sounds/salamander/ is missing the app falls back to jsDelivr.
