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

---- Newer features ----
Channel FX panel: EQ detail (band frequencies and width with a live curve), manual compressor (threshold, ratio, attack, release, makeup, with a gain-reduction meter), and Chords (per-channel chord type with strum).
Mixer: limiter gain-reduction meter, peak readout and a clip light.
Piano roll: chord picker (extra chord notes show faintly, chord name on each note) and "Hum to notes" (microphone pitch detection).
Sample editor: Detect key and "Use for project" (sets project tempo and key). Imported loops of 3 seconds or more are analysed automatically.
Embed: Share > Embed code gives an iframe. It uses ?embed=1 and shows a small player. Embeds never touch the viewer's saved beat.
Gallery: tags, search, and a Listen button (needs the Upstash/KV setup described above). api/gallery.js was updated, so upload it too.
Piano roll > "Progression and bass": write a chord progression in your key (presets or your own numbers/numerals, chord change rate, rhythm, 7ths), and a bass line (six styles) that follows the chords on any channel. Chords are written as root notes with the chord picker on, so the roll shows chord names.

---- Layout: Simple and All tools ----
New visitors start in Simple view (only the essentials). The Simple | All tools switch (top left) shows everything. The choice is kept in localStorage
('beatsynth.layout'); visitors who already finished the welcome keep the full layout. File and Export are dropdown menus. In All tools, a dashed
"More tools" bar opens Rhythm, Variation, Transitions, Mutate and Automation. On phones, Swing, Master and Level sit in a "Mix" menu.

---- Features added since the notes above ----
Tap tempo; piano-roll copy/paste and ghost notes; Perform mute scenes; audio take recording (WAV/MP3); tempo changes inside a song (per-clip BPM and ramp);
master automation lanes; "Make me a beat" (mood starters); a redone welcome with a Guide button to replay it.
Pads: a note tuner under the grid (instruments pick their note; imported audio uses "Sample is" plus the target note; synth drums tune in semitones).
Mixer: with 10 or more channels the strips split into two compact rows so the spectrum and master panels keep their size.
Sounds: 15 new synths and effects (Sub, Reese, Wobble and FM bass; Chord Stab, PWM Lead, Choir, Flute, Kalimba, Vibraphone, Glass Pad; Laser Zap, Arcade Blip,
Downlifter, Reverse Cymbal) plus two wavetable pads (Evolving Pad, Drift Pad). Wobble, Reese, FM Bass, Choir and the pads have a macro slider on their rack row.
Channel FX panel > Arpeggiator: Up, Down, Up and down or Random, speed, 1 to 3 octaves, note length. Works with the chord picker.
Key and scale is available in both the Compose and Play tools. "Keys follow scale" (on by default): the keys A to ; play only notes in the key and scale.
Guide: new topics for Simple/All tools and for synths, macros and the arpeggiator; Key and scale, Pads, Play live and Save and export were updated.

---- Tests ----
tests/smoke.test.js now has 44 tests (node:test + Playwright). Run: cd tests && npm install && npx playwright install chromium && npm test

Added in this round
- Remix this (vary or swap drums, same key), 8 new moods (16 total), Surprise me.
- Vocal chain for mic loops (clean, rap, sing, big space) via the select next to Loop rec; also in Effects presets.
- Share previews: Short link now also uploads a 600x315 preview card. api/page.js (rewritten from /?s=ID) injects Open Graph tags; api/og.js serves the image. Needs the Upstash KV env vars already used by Short links.
- Speed check: 24 channels redraw in ~20 ms; offline export time scales roughly linearly with channels (no cliffs).
