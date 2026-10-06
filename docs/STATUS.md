# Project status — Speedcubing Assistant

Handover note. Read `docs/ARCHITECTURE.md` for how the code works; this file says
**what exists, what was decided, and what is open**.

---

## What this is

A static web app for left-handed algorithm practice (2-Look OLL, 2-Look PLL, F2L),
with a built-in speedcubing timer. The algorithm sets are data in `config.json`.
Code is split into `css/` and `js/`, with no build step for the website and no
dependencies. `tools/build.js` produces a single-file version (~49 KB).

Two deployments:

| Where | URL | Notes |
|---|---|---|
| GitHub Pages (PWA) | `https://alibresm.github.io/speedcubing-assistant/` | the repo as is; installable, offline-capable |
| Claude artifact | hosted on claude.ai | the single-file build, plus account sync and a "Save edits into the page" button |

They are the **same code** apart from the Claude-only runtime hooks, which are
inert when `window.claude` is undefined.

---

## Feature list (all implemented and working)

**Reference**
- Algorithm sets, their groups and cases, default formulas, default marks
  (`status`/`shut` on each case line, `shut` on groups) and the default columns
  all come from **`config.json`**.
- **Always two columns.** Each column's header is a dropdown of all sets; picking
  the set the other column shows swaps them. `config.open` gives the defaults;
  the user's pick is remembered. No set descriptions.
- 2-Look OLL: 3 edge cases, 7 corner cases. 2-Look PLL corners: Ja, Jb, T,
  F, Diagonal, Na, Nb, Aa, Ab; edges: Ua, Ub, Z, H. Shown by default.
  Ja (`L' U' L F L' U' L U L F' L2 U L`, mirrored Jb) and Jb
  (`L U' R U2 L' U L U2 L' R'`, mirrored Ja) lead the PLL corners because other
  cases are built from them. The case called Headlights was renamed **T**
  (user's request; id `pll-head` kept; names carry no "-perm"). Full PLLs written as
  prealg + case + postalg (user's request): F `(L U F) T (F' U' L')`,
  Na `(L U L' U2) Jb (U' L U' L')`, Nb `(L' U' L U') Ja (U2 L' U L)`. Nb is
  built from Ja and Na from Jb (user's choice). Na can't be built from Ja: no
  prealg ≤ 3 + postalg ≤ 5 moves exists. A V-perm built from J was asked
  for and then withdrawn (it was N that was meant). No V found with
  prealg ≤ 3 + postalg ≤ 5 either.
- **Routes** (user's request): the OLL corner cases H, Pi, U, T and L have a
  Sune/Antisune alternative, written as `Antisune -> [Sune]`: do Antisune, and
  you have the Sune case (H and Pi `Antisune -> [Antisune]`; U, T and L
  `Antisune -> [Sune]`). **Antisune first wherever possible** (user's request:
  Antisune `L' U' L U' L' U2 L` is the one the user knows best). Diagonal has `Ja -> [Ja]`. Sune and Antisune have **no** route
  (via each other; removed at the user's request), nor have T (Headlights), Ua
  and Ub (J routes added and removed). **A route starts from the same picture as
  the case's first formula, with no U turn in front** (user's request). Choose
  Sune or Antisune to make that true: The **main H formula** is Antisune twice written out:
  `(L' U' L U' L' U2 L) (L' U' L U' L' U2 L)` (same moves as the old
  `L' U' L U' L' U L U' L' U2 L`; bars left and right). Sune twice was tried
  and rejected: it turns H a quarter (bars front and back). The user had mixed
  up the names; the app's names are right: Sune `L' U2 L U L' U L`, Antisune
  `L' U' L U' L' U2 L`. The U turn before the second step
  (recognise, then AUF) is not written; the picture accounts for it. In
  a formula, a case name of the same set stands for that case's formula. The diagram
  includes solving the case after `->`, with the U turn between that makes the
  route start from this case. A route that can't start from this case turns the box
  orange ("Doesn't lead to X from this case"). Mirror does nothing on a route.
- F2L: 12 left-hand cases into the **front-left** slot, in three groups (basic
  inserts, white on the side, white on top), each as an L-side and F-side
  variant. Top-view diagrams.
- F2L advanced: the other **29** front-left cases, so F2L + F2L advanced cover
  all 41. Groups: both on top (12), corner in slot (6), edge in slot (6), both in
  slot (5). The diagram (`f2l-slot`) adds the slot's front and left stickers next
  to the top view. Names describe what you see, e.g. "Split, green + red on top"
  (corner colour + edge colour facing up), "White left, red on top", "Corner in
  place, edge flipped".
- Every formula is **editable inline**; the diagram regenerates from the formula
  as you type. There is no stored case picture.
- Diagrams are SVG, drawn from the top with the front at the bottom, with
  irrelevant stickers greyed per step.
- PLL diagrams carry **arrows**: solid for the pieces that step is about,
  thin/dashed/faded for the pieces the formula also moves. Double-headed = swap,
  single-headed = 3-cycle.
- Validation per case, **without any text under the formula**: a typo turns the
  formula box red; "breaks the first two layers / other slots" or "does nothing"
  turns it orange. The reason shows on hover. Valid formulas show nothing. (A
  message line, including "Finish with U", was removed at the user's request.)
- **Mirror** button (left↔right) and **Reset** per case (they act on the formula
  shown).
- **Several formulas per case**: a case can hold alternatives (`algs` in the
  config). A small ▾ at the end of the formula box opens a list of all the
  case's formulas, written out in full (including your edits); picking one
  shows it (open cases only), and the choice is remembered. The names in the
  config (Ua/Ub: "M" / "no M"; Aa: "x" / "x'" / "r" / "F/B"; Ab: "x" / "x'" /
  "F/B") are not shown, only used as tooltips. The x' ones: Aa
  `x' L' U L' D2 L U' L' D2 L2`, Ab `x' L2 D2 L U L' D2 L U' L` (the user's
  original Ab); found by searching all x' + L/U/D formulas of the A-perm shape. Aa's "r" (`r L D2 L' U' L D2 L' U L'`) is kept
  at the user's request. Ab has no r version: written with r it would equal its
  x formula (r = x + L). The extra formulas are
  mirrored standard algorithms, checked to solve the same case; the picture
  turns to however that formula holds the cube.
  (Rejected before this: a "label ⇄" chip after the case name, and a dropdown
  of names before the formula.)
- Note: **Mirror** on Ua's M formula gives exactly Ub's M formula (it swaps U
  and U' and leaves M as is), and the result is saved as an edit (yellow border).
  Reset restores it.
- Probability of each case shown in small grey text next to its name.
- Cases sorted most-common-first; Sune and Antisune lead the OLL corners because
  the other cases are built from them.

**Learning state**
- Three-state marker per case, always a circle (drawn in CSS so all three are the
  same size): empty = not learned → half = learning → full = learned, tinting the
  row yellow/green. Shown only on open cases; collapsed rows keep the tint.
- Collapse a single case to a one-line entry, or a whole group by its header.

**Timer**
- Hold space (or press and hold the clock) → green → release to start; press to stop.
- Optional 15 s inspection with automatic +2 / DNF.
- 20-move scramble, wrapped 5 per line, refreshed after each solve.
- Stats: count, best, ao5, ao12, mean, under WCA rules (drop best and worst,
  one DNF tolerated).
- Times list with +2 / DNF / delete per solve, and a two-step "Clear session".
- Collapses to a usable one-line bar (clock + scramble) that still times solves.

**Layout**
- Both views: title + **Menu** dropdown, the same timer contents (times behind
  **Times ▾**; the fold button shrinks it to one line), two columns, the same
  small text sizes.
- Full view (PC): timer as a sticky **sidebar on the left**, Mirror/Reset shown.
  Compact: timer as a sticky **bar on top**, Mirror/Reset hidden. Cube size is
  the same in both. Compact is used whenever sidebar + two columns don't fit
  (measured, ≈ <1000px wide), not at a fixed breakpoint.
- Case row: ▾ on the name line with the status circle under it, the cube, then
  the name (with the % next to it, Mirror/Reset at the right) and the formula
  under the name. The cube is as tall as name + formula. A collapsed case is the
  same row without circle, cube and formula: ▸ name, ▸ in the same place.
- **Text size − / +** in the Menu, 12–22px (default 16), scales text and cubes.
  Stored only in this browser, not in `config.json`, exports or offline copies.
- **Keep screen on** toggle in the Menu (Screen Wake Lock), so the phone doesn't
  sleep between solves. Per browser; re-taken when you return to the app. Where
  it isn't possible it's greyed out as "Keep screen on: –", with no message
  (user's request).
- **Print sheet** button: one-page, two-column, no chrome, always light colours,
  collapsed sections printed open.
- **Theme** button: auto → light → dark, remembered.

**Data portability**
- Edits, marks, collapse state and the column choice persist in localStorage.
- **Export .json** / **Import .json** to move them between browsers and builds.
- **Download offline copy**: regenerates a complete standalone HTML (all CSS, JS
  and config inlined) with the current formulas, marks and columns baked in as
  the new defaults. Works from disk.
- Claude build only: syncs to the Claude account, and "Save edits into the page"
  rewrites the published artifact's defaults.

---

## Decisions already made (don't re-litigate without asking the user)

- **Left-hand algorithms are the point.** The page exists because the user solves
  left-handed. Don't "fix" formulas to right-hand standards.
- **Exception, user's own choice: Aa uses `x R' U R' D2 R U' R' D2 R2`** (the
  standard right-hand Aa), and **Ab its mirror `x L U' L D2 L' U L D2 L2`**. This
  is how the user remembers them: after the x, the corner that moves diagonally
  is on top. They replaced the earlier x formulas (`x L2 D2 L' U' L D2 L' U L'`
  / `x' L2 D2 L U L' D2 L U' L`). Don't change these to left-hand.
- **No AUF padding on alternative formulas** (user's request): a formula is not
  prefixed with U / U' just to match another formula's picture. Routes need none either: they
  start from the first formula's picture by choosing Sune or Antisune. The diagram is
  drawn from the formula shown, so it simply turns when you switch.
- **Right-hand duplicate rows were added and removed** — rejected as clutter.
- **Sune/Antisune composition notes** (H = Sune twice, Pi = Sune U Sune, etc.) were
  added as a second formula field, then as a note line, then in the case name —
  **all removed**. The user did not want them. Later (2026-10-06) the user asked
  for them as **alternative formulas** in the `Sune -> [Antisune]` form (see
  Routes); that is the accepted form.
- **F2L**: an earlier F2L section (11 cases) was built and removed. It was
  **re-added on the user's request** as a config set, not shown by default.
  It's left-handed (front-left slot), with the `f2l` mask retargeted from
  front-right to front-left.
- **Code split into files + `config.json`** (user's request). This replaced the
  old single-file design (markup in a `SKELETON` string, user defaults in a
  `/*BAKED*/` blob). The blob's formulas, marks and collapsed groups were migrated
  into `config.json`.
- **Columns** (user's request): always exactly two, each header a dropdown of
  sets, no set descriptions. A short-lived "View" checkbox version that showed
  any number of columns was replaced by this.
- **Marks live on the config lines** (user's request): `status`/`shut` on each
  case, `shut` on groups, not in separate top-level maps.
- **Full and compact views are kept alike** (user's request): one Menu dropdown
  (no inline toolbar), the same text sizes (small), the same timer contents.
  **On PC the timer stays a sidebar on the left**; only compact puts it on top.
  (A version with the top bar on PC too was tried and rejected.)
- **Case rows** (user's request): open rows are built like collapsed ones (icons
  side by side, then cube, then name with the formula under it); collapsed rows
  drop the cube and formula. Earlier versions were rejected: a bold, larger name
  on collapsed rows, and collapsed names aligned to the open rows' column.
- **Text size is a per-browser setting** (user's request), never stored in the
  config.
- **Cube colours** were changed to "more natural" pigments and **reverted**; the
  current palette is the one the user wants.
- **Scramble "B/D bias"** was investigated: measured uniform over 400k moves
  (16.6–16.8% per face). Not a bug.
- **No `alert`/`confirm`** — artifact frames block modals. This broke "Clear
  session" once. Destructive actions use a two-step button; messages go to `#sync`.

---

## Verified

- All 18 OLL/PLL formulas were checked programmatically: each solves the case it is
  labelled as, under some AUF, and none disturbs the first two layers. Verified
  with deliberately swapped references to prove the check can fail.
- Routes: each expanded route is solved by its case's first formula (some U
  first), and none disturbs the first two layers. A wrong route (H `Sune -> [Pi]`)
  is flagged. The search behind them tried Sune and Antisune (or Ja) followed by
  every case of the set: Sune/Antisune targets were preferred for OLL.
- Ja, Jb, T, F, Na and Nb (expanded) each solve the same case as the
  standard right-hand algorithm (some AUF before and after); swapped references
  (Na/Nb, Ja/Jb, F/T) fail. The prealg/postalg pairs came from a
  meet-in-the-middle search over setups, preferring L/U/F moves.
- All 12 F2L formulas: each inserts the front-left pair from a top-layer position
  and leaves the cross and the other three slots intact. They are mirrors of
  standard right-hand algorithms.
- F2L advanced: generated, not typed from memory. Every front-left pair position
  was classified (41 classes mod AUF; the 12 basic ones skipped). Mirrored
  standard algorithms plus a search over up to 3 inserts (`L' U L`, `F U F'`,
  sledgehammers, with U turns between) were tried. Each case got the shortest
  formula that solves it and keeps the cross and other slots, with known
  algorithms preferred unless 2+ moves longer. All 29 pass the in-app check.
- After the restructure, the formulas loaded from `config.json` are identical to
  the old baked ones. The served site, the in-page offline copy and
  `tools/build.js` output all load without errors, and the copies can rebuild
  themselves.
- Offline load from the service worker cache: confirmed with the network cut.
- Scramble face distribution: uniform.
- Cross-length statistics (computed by exhaustive BFS over all 190,080 cross
  states, for reference, not in the app): average 5.81 moves, max 8, 99.95%
  solvable in ≤7. Colour neutrality: white only 5.81, dual 5.35, full CN 4.76.

---

## Known limitations

- Scrambles are **random-move, not random-state**. No solver is embedded. A
  WCA-style random-state scrambler would need a Kociemba implementation
  (a few hundred KB).
- Times are **not** exported in the `.json` and do not sync between devices in the
  self-hosted build.
- `config.json` is a snapshot. Edits made in the browser or the Claude version
  afterwards must be carried over with Export/Import .json, or by copying the
  inline config out of a downloaded offline copy.
- Opening `index.html` straight from disk doesn't load the cases (`file://`
  blocks fetching `config.json`). Use a web server, or the single-file build.
- At the current cube size (name + formula height) the F2L advanced diagrams,
  which also draw the slot, are small; larger text size helps.
- Some F2L advanced formulas come from the search rather than a named standard
  algorithm. They're correct but may not be the most finger-friendly; edit freely.
- No per-case practice timing or trainer mode.

---

## Ideas discussed but not built

Roughly in the order the user found them interesting:

1. **Case trainer** — pick a case (optionally only those marked "learning"),
   generate a setup from the formula's inverse plus a random AUF, drill it, and
   time each attempt. Would reuse the existing cube engine and timer. This was the
   recommended next feature.
2. **Per-case times** feeding back into which cases are actually slow.
3. **Tag each solve** with the OLL/PLL case encountered, to expose recognition gaps.
4. Step through a formula move by move on the diagram.
5. Full OLL (57) and PLL (21) as extra sets in `config.json`. The engine and
   column dropdowns already handle them; it's data entry plus verification.
6. Right-hand mirror toggle for the whole page.
7. CSV export / csTimer import.
8. **CUBOTino integration**: the user has a CUBOTino-style robot interest and an
   ESP32-C3. Conclusion reached: a published artifact can never reach a device on
   the LAN (CSP), but a copy served *from* the device can. Split suggested — browser
   does the solving, ESP32-C3 drives the servos over WebSocket, no camera and no
   Kociemba on the C3 (needs an S3 for a camera; pruning tables don't fit in RAM).

---

## Maintenance rules

- **Bump `CACHE` in `sw.js`** whenever any app file changes, and list new files
  in `ASSETS`, or installed devices keep serving the old version.
- **`config.json` holds the user's formulas, marks and collapsed groups as
  defaults.** Don't reset them to textbook values.
- Case and set ids are permanent keys for stored data. For cases with several
  formulas, the first variant is stored under the case id: don't reorder it,
  and keep variant ids stable.
- After changing the app, run `node tools/build.js` before publishing to Claude.

---

## Repo contents

```
index.html              markup; links the CSS and scripts
config.json             algorithm sets with default formulas and marks, default columns
css/app.css             styles
js/                     cube.js, store.js, cases.js, timer.js, ui.js, app.js
manifest.json           PWA manifest
sw.js                   service worker (cache-first)
icons/                  icon-192.png, icon-512.png, icon-512-maskable.png
tools/build.js          single-file build → dist/ (git-ignored)
README.md               install and deploy instructions
CLAUDE.md               rules for AI-assisted editing
docs/ARCHITECTURE.md    how the code works
docs/STATUS.md          this file
```
