# Speedcubing Assistant (PWA)

2-Look OLL / PLL reference with a built-in timer. Installs to the home screen and runs offline.

## Files

| File | Purpose |
|---|---|
| `index.html` | the whole app: formulas, generated diagrams, timer |
| `manifest.json` | name, icons, colours, standalone display |
| `sw.js` | service worker: caches the app for offline use |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | app icons |

## Put it on GitHub Pages

1. Create a repository, e.g. `speedcubing-assistant`.
2. Upload all files from this folder to the repository root (drag and drop in the web UI works).
3. **Settings → Pages**, source: branch `main`, folder `/ (root)`. Save.
4. After a minute the app is live at
   `https://<your-user>.github.io/speedcubing-assistant/`

HTTPS is required for a PWA, and GitHub Pages provides it.

## Install it

- **Android / Chrome:** open the link, menu → *Install app* (or *Add to Home screen*).
- **iPhone / Safari:** open the link, Share → *Add to Home Screen*.
- **Desktop Chrome / Edge:** install icon in the address bar.

After the first visit it works with no connection.

## Updating

Replace `index.html` in the repository, then bump the cache name in `sw.js`
(`const CACHE = "cubing-v2";`). Without that bump, devices keep serving the cached
old version. On the next online start the app shows
"New version ready — reload to update" in the status line.

## Your data

Formulas you edit, learned/learning marks and solve times live in the browser's
local storage, on each device separately. They are never uploaded, so GitHub never
sees them — and they do not sync between devices. Use **Export .json** / **Import .json**
in the menu to move them across.

The Claude-hosted version of this page syncs through your Claude account; this
self-hosted copy does not.
