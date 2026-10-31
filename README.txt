Beat Synthesizer - deploy notes

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
