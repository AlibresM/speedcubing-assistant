# Speedcubing Assistant (PWA)

Left-hand algorithm reference (2-Look OLL, 2-Look PLL, F2L) with a built-in timer.
Installs to the home screen and runs offline.

## Files

| Path | Purpose |
|---|---|
| `index.html` | page markup; loads the CSS and scripts |
| `config.json` | **the algorithm sets**: groups, cases, default formulas, which sets are open |
| `css/app.css` | styles |
| `js/*.js` | cube engine, case lists, storage, timer, layout, boot |
| `manifest.json` | name, icons, colours, standalone display |
| `sw.js` | service worker: caches the app for offline use |
| `icons/` | app icons |
| `tools/build.js` | builds the single-file version into `dist/` |
| `docs/` | `ARCHITECTURE.md` (how it works), `STATUS.md` (what's done and decided) |

## Editing the algorithms

Everything about the sets lives in `config.json`:

- `sets`: each set has a `title` and groups; each group has cases, one per line:
  `id`, `name`, `alg`, and optionally `prob`, `status` (`"learning"` /
  `"learned"`) and `shut: true` (collapsed). A group can have `shut: true` too.
  Diagrams are drawn from the formulas, so adding a case only takes a new line.
  A case can have several formulas instead of one: `"algs": [{ "id", "label",
  "alg" }, …]` (see Ua/Ub, Aa/Ab). The page then shows a small ▾ at the end of
  the formula box that lists all of them. The `label` is for you; the page only
  uses it as a tooltip. Keep the first one first; it holds edits made before the others
  were added.
- `open`: the two sets shown in the left and right columns by default. The
  page always has two columns, and each column's title is a dropdown to pick
  any set.

Don't rename a case `id`; stored edits and marks are keyed by it.

## Put it on GitHub Pages

1. Upload the whole folder (keeping `css/`, `js/`, `icons/`) to the repository root.
2. **Settings → Pages**, source: branch `main`, folder `/ (root)`. Save.
3. After a minute the app is live at
   `https://<your-user>.github.io/speedcubing-assistant/`

HTTPS is required for a PWA, and GitHub Pages provides it.

Opening `index.html` directly from disk doesn't load the algorithms, because
browsers block reading `config.json` from `file://`. Use a local server
(`npx serve`, `python -m http.server`) or the single-file build.

## Single-file build (Claude artifact, opening from disk)

```
node tools/build.js
```

This writes `dist/speedcubing-assistant.html`, with all CSS, JavaScript and the
config inlined. **Download offline copy** in the app produces the same kind of
file, with your current edits baked in.

## Install it

- **Android / Chrome:** open the link, menu → *Install app* (or *Add to Home screen*).
- **iPhone / Safari:** open the link, Share → *Add to Home Screen*.
- **Desktop Chrome / Edge:** install icon in the address bar.

After the first visit it works with no connection.

## Updating

After changing any file, bump the cache name in `sw.js`
(`const CACHE = "cubing-v3";` → `"cubing-v4"`). If you added a file, also list it
in `ASSETS` there. Without the bump, devices keep serving the cached old version.
On the next online start the app shows "New version ready — reload to update".

## Your data

Formulas you edit, learned/learning marks, the column choice and solve times live in
the browser's local storage, on each device separately. They are never uploaded,
so GitHub never sees them, and they don't sync between devices. Use
**Export .json** / **Import .json** in the menu to move them across.

The Claude-hosted version of this page syncs through your Claude account; this
self-hosted copy does not.
