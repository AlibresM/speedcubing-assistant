# Architecture

Speedcubing Assistant is a static web app: plain HTML, CSS and classic scripts.
There's no framework and no runtime dependencies apart from Google Fonts (optional;
the page falls back to system fonts). The site runs straight from the repo with no
build step. A small optional build (`tools/build.js`) puts everything into one HTML
file for places that need a single file.

Read this before changing anything. Two mechanisms are unusual:

- **The algorithm sets live in `config.json`.** Sets, groups, cases, default
  formulas, default marks, and which set each of the two columns shows all come
  from there. The code hard-codes no cases.
- **The page can rebuild itself as one standalone file**, with the user's current
  formulas baked into an inline config. It does this for *Download offline copy*
  and the Claude artifact's *Save edits into the page*.

---

## 0. Files

```
index.html          markup only; links css/app.css and the six scripts
config.json         algorithm sets with default formulas and marks, default columns  (§2)
css/app.css         all styles: tokens, desktop, .compact, print  (§8)
js/cube.js          cube model, move engine, diagrams: pure, no DOM  (§3, §4)
js/store.js         user data in localStorage + Claude account sync  (§5, §6)
js/cases.js         renders sets/cases from the config, validation, column pickers  (§4)
js/timer.js         timer  (§7)
js/ui.js            full/compact sizing, theme, print, menu  (§8)
js/app.js           boot, import/export, single-file builder, PWA  (§1)
manifest.json, sw.js, icons/   PWA shell  (§9)
tools/build.js      → dist/speedcubing-assistant.html (single file; dist/ is git-ignored)
docs/               this file and STATUS.md
```

The scripts are **classic scripts, not modules**, loaded in the order above. They
share top-level names (`CFG`, `saved`, `layout`, `fit`, …) through the global
scope. That's what lets the single-file build inline them unchanged. Nothing runs
at load except definitions and listeners; `app.js` starts everything.

---

## 1. Boot sequence

```
index.html: static markup inside <div id="app">: two empty columns, empty #stash
   ↓ scripts load in order
app.js: SKELETON = #app.innerHTML        (pristine markup, for the single-file builder)
   ↓
tInit(), initUI(), initPWA()             timer, theme, menu work even if the config fails
   ↓
CFG = inline <script id="config"> JSON, or fetch("config.json")
   ↓
initStore(CFG) → renderSets() → renderPickers() → loadAll() → showSets() → initData()
   ↓
layout()  (and again after web fonts load)
   ↓
initCloud(), initBake()                  Claude artifact only
```

If `config.json` can't be fetched (typically because `index.html` was opened from
disk, where `file://` blocks fetch), the timer still works and the status line
says to use a web server or the single-file build.

### Single-file pages

`buildPage(cfg)` in `app.js` assembles:

```
<head> HEADBITS + <style data-app-css>(css)</style>
<body> <div id="app">SKELETON</div>
       <script type="application/json" id="config">(cfg)</script>
       <script data-app>(each script)</script> …
```

It reads the CSS and scripts **from the running page**: elements marked
`data-app-css` / `data-app` are fetched if they have `href`/`src`, otherwise their
inline text is used. So a single-file copy can rebuild itself again, and the same
code works on GitHub Pages (fetch, served from the service worker cache when
offline) and inside an inlined file (no fetch).

`tools/build.js` does the same from the files on disk. It also drops the
`data-pwa` head tags (manifest, icons). An inline `#config` element is also how the
code tells it's running as a standalone copy: there it skips the service worker,
and the status line says "Offline copy".

---

## 2. `config.json`

```json
{
  "open": ["oll", "pll"],
  "sets": [
    { "id": "oll", "title": "2-Look OLL",
      "groups": [
        { "n": 1, "label": "Edges", "mask": "edges", "shut": true,
          "cases": [
            { "id": "oll-l", "name": "L-Shape", "alg": "f' L' U' L U f", "prob": "50%", "status": "learned" }
          ] } ] }
  ]
}
```

* **open**: the sets the left and right columns show by default. There are
  always exactly two columns. Each column header is a dropdown of every set's
  `title`, which overrides this per user (§5).
* **sets[].id**: also the prefix of group keys (`oll1` = set `oll`, group `n: 1`).
* **cases[].id**: stable key for stored user data and `data-id` in the DOM.
  **Never rename an id** without migrating stored data, or users' edits are orphaned.
* **cases[].alg**: the default formula. **The diagram is generated from it**;
  there is no stored case picture.
* **mask**: per group; decides diagram colouring and validation (§4):
  `"edges"` | `"oll"` | `"corners"` | `"full"` | `"f2l"` | `"f2l-slot"`.
* **prob**: optional display string only.
* **status** (case, optional): `"learning"` or `"learned"`. **shut** (case or
  group, optional): `true` = collapsed. These are defaults until the user changes
  their own marks. At runtime `initStore()` turns them into the flat `status` /
  `shut` maps (group key = set id + `n`, e.g. `oll1`); `bakedConfig()` writes
  them back onto the lines.

### Cube state

A cube is a flat array of **54 sticker objects**:

```js
{ p: [x,y,z],   // current position of the cubie this sticker is on
  n: [x,y,z],   // outward normal: which way the sticker faces
  f: "U",       // the sticker's colour, as a face letter (never changes)
  h: [x,y,z] }  // home position, for tracking where a piece belongs
```

Coordinates are −1/0/+1. `y=+1` is the top layer, `x=−1` the left. `NORM` maps a face
letter to its normal vector; `COL` maps it to a hex colour.

---

## 3. Move engine (`js/cube.js`)

| Function | Purpose |
|---|---|
| `parse(str)` | `"R U2 R'"` → `[["R",1],["U",2],["R",-1]]`. Accepts `RLUDFB`, slices `MES`, wide `rludfb` and `Rw` form, rotations `xyz`, modifiers `'` and `2`. Brackets are stripped. Throws on unknown tokens. |
| `MV` | move table: `[axis, layerTest, baseQuarterTurns]`. Axis 0=x, 1=y, 2=z. `layerTest(coord)` selects which slices move, so wide moves and rotations fall out of the same code. |
| `apply(st, moves)` | mutates a state in place |
| `rot(v, ax, q)` | rotate a vector by quarter turns |
| `invert(moves)` | reverse order, negate each |
| `fmt(moves)` | back to a string |
| `mirror(str)` | left↔right mirror: swap R/L and r/l, negate everything except M and x |
| `orientFix(moves)` | if a formula ends with the cube rotated (e.g. an A-perm starting with `x`), returns the rotation that puts U back on top |

### The central trick

**A case diagram is generated by applying the formula's inverse to a solved cube.**

```js
const st = solved();
apply(st, invert(parse(formula)));
```

The result *is* the position the formula solves, so formula and picture can't
drift apart. For PLL masks, `update()` also tries all four AUF turns and keeps the
one that moves the fewest pieces.

---

## 4. Rendering

### `draw(st, mask)` → SVG string (`cube.js`)

Draws the top layer from above in a 100×100 viewBox: a 3×3 grid of U-facing stickers
plus a rim of side stickers. Front is at the bottom.

| mask | shows in colour |
|---|---|
| `edges` | top-layer edges only (OLL step 1) |
| `oll` | any sticker whose colour is U (OLL step 2) |
| `corners` | corners only (PLL step 1), with arrows |
| `full` | everything (PLL step 2), with arrows |
| `f2l` | the **front-left** corner + edge pair only (`inPair`) |
| `f2l-slot` | as `f2l`, plus the front-left slot unfolded: its front stickers below the front rim and its left stickers left of the left rim (middle layer nearest, bottom layer outside); viewBox `-26 0 126 126` |

F2L is left-handed: the target slot is front-left, and cases insert with `L` / `F`.
Validation for both F2L masks: everything except the pair and the top layer must
be solved ("Breaks the other slots or the cross"), and the pair must be out of
place *or* twisted/flipped in place ("Does nothing to the pair").

`arrows(st, mask)` draws an arrow for each displaced top-layer piece. Swaps get
double heads and 3-cycles single heads. Pieces from the other sub-step are drawn
thin, dashed and faded.

### `update(li, id, mask)` (`cases.js`)

Per case row: parse → state → `draw` → `.pic`, resize the textarea, flag problems.
There is **no message line** under the formula (the user rejected it). A problem
sets a class on the textarea, which colours its border, and puts the reason in
its `title` (hover):

* parse error → `.err` (red), e.g. "Unknown move: Q"
* `f2l` / `f2l-slot`: "Breaks the other slots or the cross" / "Does nothing to
  the pair" → `.warn` (orange)
* otherwise `checkF2L` fails → "Breaks the first two layers" → `.warn`
* `isSolvedLL` → "Does nothing to the last layer" → `.warn`
* valid → no class, no title

**There is no stored "expected" answer**; validation is structural.

### Sets and columns

`index.html` has two fixed `<section class="col">` elements, each with a
`<select class="setpick">` header and a `.colbody`. `renderSets()` renders
**every** set once as a `<div class="setbody" data-set>` into the hidden `#stash`.
`showSets()` moves the two chosen set bodies into the columns and the rest back
to the stash, so all formulas stay in the DOM and are still exported and baked.
Picking the set the other column shows swaps the two columns.

---

## 5. Storage (`js/store.js`)

| Key | Contents |
|---|---|
| `twolook-algs-v1` | `{ algs: {id: formula}, status: {id: "learning"\|"learned"}, shut: {id\|groupKey: 1}, open: [setId]\|null, at: epoch_ms }` |
| `twolook-times-v1` | `{ times: [{ms, scr, plus2, dnf, at}], shut: bool, insp: bool }`, capped at the last 300 |
| `twolook-theme` | `"auto"` \| `"light"` \| `"dark"` |
| `twolook-text` | root font size in px, `12`–`22`; local only |

Only **changed** formulas go into `algs`; a value equal to the config default is
deleted, so `Reset` and later config changes behave predictably. `open` (the
`openPick` variable) is `null` unless the user picked columns that differ from
`config.open`, so editing `config.open` still takes effect for everyone who
hasn't chosen their own.

### Baking

`bakedConfig()` returns the config with every case's `alg` replaced by the current
formula, the current marks written onto the case/group lines, and the current
columns as `open`. Two writers use it:

* **Download offline copy**: `buildPage(bakedConfig())` → `speedcubing-assistant.html`.
* **Save edits into the page** (Claude artifact only): same, then republishes.

To carry edits back into the repo, use **Export .json**, or copy the inline config
out of a downloaded offline copy into `config.json`.

---

## 6. Claude-hosted extras (absent in the GitHub/PWA build)

The artifact is the single-file build. Guarded by `if (window.claude?.use)`:

* `db` + `user`: syncs the `twolook-algs-v1` payload to `data/users/<id>/algs`,
  last-write-wins by `at`.
* `artifact`: the **Save edits into the page** button, shown only to the owner.
* `downloads`: native file save; falls back to a Blob + `<a download>` elsewhere.

**Never use `alert`/`confirm`**: artifact frames block modals. Destructive actions
use a two-step button; messages go to the `#sync` line.

---

## 7. Timer (`js/timer.js`)

State machine in `beginHold` / `endHold` / `stopTimer`, driven by the space bar
(ignored while a text field has focus) and by touch/mouse on the clock.

```
idle ──hold≥300ms──▶ ready ──release──▶ run ──any press──▶ idle (time recorded)
  └─with inspection─▶ insp ──hold/release──▶ run
```

Inspection: 15 s; overrun up to 2 s attaches `plus2`, beyond that `dnf`.
`scramble(20)` is **random-move, not random-state**; face distribution is uniform.
Statistics follow WCA rules: `avg(list,k)` drops best and worst of the last *k*;
two DNFs in a window make the average DNF.

---

## 8. Layout and CSS

Custom properties on `:root`; the dark theme is defined three times so every
combination works:

```css
:root { --bg: #fff; ... }                                   /* light */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }
:root[data-theme="dark"] { ... }                            /* explicit */
```

Both views share the title + **Menu** dropdown (all actions and the `#sync` line),
the same timer contents (scramble, clock, one-line stats, times behind
**Times ▾**), two columns, and **the same text sizes** (the small ones).

* **Full**: the timer is a 250px sticky **sidebar on the left** (`.layout` flex
  row), with Mirror/Reset visible. `.wrap` max 1280px.
* **Compact**: the timer is a sticky **bar on top** (clock on the right), with
  Mirror/Reset hidden. All rules are `.compact …` overrides inside
  `@media screen`: timer placement and spacing. Keep text and cube sizes in the
  base rules.

The fold button shrinks the timer to one line (clock + scramble). It carries both
glyphs (`.g-side` ◂/▸, `.g-top` ▴/▾) and CSS shows the one for the current view.

A case row is `[fold status] [cube] [name % … Mirror Reset / formula]`.
A collapsed case (`.case.shut`) is the same row without the cube, %, formula and
buttons, so it's one slim line: `[fold status] name`. Two custom properties on
`.case` keep it consistent:
- `--nameh`: the name line's height. The icon strip and buttons are that tall,
  so the icons sit on the name line in the same place, open or collapsed.
- `--algh`: a one-line formula box. The cube is `--nameh + 2px + --algh`
  square, i.e. as tall as name + formula. A formula that wraps grows past it.

**Text size** (Menu → *Text size − n +*) sets the root font size, 12–22px in 1px
steps (default 16). Everything is in `rem`, cubes included, so it all scales.
It's stored only in this browser (`twolook-text`), never in the config, exports
or offline copies.
* **Print**: no timer or menu, light colours, collapsed sections opened, the two
  columns.

There is no width breakpoint. `layout()` (`ui.js`) removes `html.compact`, measures,
and puts the class back unless, with the sidebar in place, every case header
(name + % + Mirror + Reset) of the two shown sets fits on one line in its column
(hidden probe row) and nothing scrolls sideways. The sidebar has
`max-height: 100vh - 16px` and scrolls itself, so window height never forces compact. Only width matters: it runs on boot, after fonts load, when a column's
set changes, and on resizes that change the width. Height-only resizes (on-screen
keyboard, mobile address bar) are ignored. Roughly ≥1000px wide gets the full view.

Collapsing: `.case.shut` and `.step.shut` hide content via CSS. Textareas are sized
by `fit()`, which **must** re-run when a container becomes visible; a textarea
measured while `display:none` reports zero height.

---

## 9. PWA shell (self-hosted build only)

| File | Role |
|---|---|
| `manifest.json` | name, icons, `display: standalone`, theme colour |
| `sw.js` | cache-first service worker; `ASSETS` lists every app file |
| `icons/` | 192, 512 and maskable 512 icons |

**Bump `CACHE` in `sw.js` whenever any app file changes**, and add new files to
`ASSETS`, otherwise installed devices keep serving the old copy. The page writes
"New version ready — reload to update" into `#sync` on `updatefound`.

---

## 10. How to make common changes

**Add a case**: add an object to a group's `cases` in `config.json`, with a new id.
The row, diagram, validation and storage key all derive from it.

**Add a set** (e.g. full PLL): add an entry to `sets`. It appears in both column
dropdowns; put its id in `open` to show it by default. A new kind of diagram needs a `mask`
branch in `colour()` and possibly in `update()`.

**Change a default formula**: edit `alg` in `config.json`. Users who edited that
case keep their version.

**Change the markup**: edit `index.html` inside `<div id="app">`. Keep ids that the
scripts use.

**Add a script**: add `<script src=… data-app>` to `index.html`, in dependency
order, and add it to `ASSETS` in `sw.js`.

**Publish to Claude**: `node tools/build.js`, then publish
`dist/speedcubing-assistant.html`.

---

## 11. Invariants worth preserving

1. Diagrams are always derived from formulas. Never hard-code a case picture.
2. Case and set ids are permanent keys. Renaming one orphans stored user data.
3. Every app stylesheet/script carries `data-app-css` / `data-app`, and the scripts
   stay classic (non-module), or the single-file builders produce broken pages.
4. Nothing mutates `#app` before `app.js` captures `SKELETON`.
5. No `alert`, `confirm` or `prompt`.
6. No external runtime dependency beyond the optional web font.
7. Everything degrades: no `window.claude`, no service worker, no localStorage.
   The page still works.

---

## 12. Testing

There is no test suite. `js/cube.js` is pure, so it can be loaded in Node for
engine checks:

```js
const src = fs.readFileSync("js/cube.js", "utf8").replace(/^const /gm, "var ");
(0, eval)(src);   // now solved(), parse(), apply(), invert(), mirror(), draw() … are global
```

All formulas were verified this way. OLL/PLL: each solves its case under some AUF
without touching the first two layers. F2L: each inserts the front-left pair and
leaves the cross and other slots alone. Playwright, against a local HTTP server
(`config.json` needs one), was used for layout, views, persistence, the offline
copy and the service worker cache.
