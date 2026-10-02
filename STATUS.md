# Project status — Speedcubing Assistant

Handover note. Read `ARCHITECTURE.md` for how the code works; this file says
**what exists, what was decided, and what is open**.

---

## What this is

A single-file web app for 2-Look OLL and PLL practice, left-hand oriented, with a
built-in speedcubing timer. No build step, no dependencies, ~43 KB of HTML.

Two deployments:

| Where | URL | Notes |
|---|---|---|
| GitHub Pages (PWA) | `https://alibresm.github.io/speedcubing-assistant/` | installable, offline-capable, self-hosted |
| Claude artifact | hosted on claude.ai | same app, plus account sync and a "Save edits into the page" button |

They are the **same code** apart from the Claude-only runtime hooks, which are
inert when `window.claude` is undefined.

---

## Feature list (all implemented and working)

**Reference**
- 2-Look OLL: 3 edge cases, 7 corner cases. 2-Look PLL: 4 corner cases
  (Headlights, Diagonal, Aa, Ab), 4 edge cases (Ua, Ub, Z, H).
- Every formula is **editable inline**; the diagram regenerates from the formula
  as you type. There is no stored case picture.
- Diagrams are SVG, drawn from the top with the front at the bottom, with
  irrelevant stickers greyed per step.
- PLL diagrams carry **arrows**: solid for the pieces that step is about,
  thin/dashed/faded for the pieces the formula also moves. Double-headed = swap,
  single-headed = 3-cycle.
- Validation per case: unparseable moves, "Breaks the first two layers",
  "Does nothing to the last layer", "Finish with U" for a leftover AUF.
- **Mirror** button (left↔right) and **Reset** per case.
- Probability of each case shown in small grey text in the left strip.
- Cases sorted most-common-first; Sune and Antisune lead the OLL corners because
  the other cases are built from them.

**Learning state**
- Three-state marker per case: ○ not learned → ◐ learning → ✓ learned, tinting
  the row yellow/green.
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
- Desktop: timer sidebar left, OLL and PLL columns. Used only when it all fits.
- Compact (whenever the desktop layout doesn't fit the window, measured, not a
  fixed breakpoint): timer as a sticky top bar, toolbar behind a **Menu** dropdown,
  times list behind **Times ▾**, OLL/PLL side by side, 46px diagrams. There is no
  longer an intermediate single-column layout.
- **Print sheet** button: one-page, two-column, no chrome, always light colours,
  collapsed sections printed open.
- **Theme** button: auto → light → dark, remembered.

**Data portability**
- Edits, marks and collapse state persist in localStorage.
- **Export .json** / **Import .json** to move them between browsers and builds.
- **Download offline copy**: regenerates a complete standalone HTML with the
  current formulas baked in as the new defaults.
- Claude build only: syncs to the Claude account, and "Save edits into the page"
  rewrites the published artifact's defaults.

---

## Decisions already made (don't re-litigate without asking the user)

- **Left-hand algorithms are the point.** The page exists because the user solves
  left-handed. Don't "fix" formulas to right-hand standards.
- **Right-hand duplicate rows were added and removed** — rejected as clutter.
- **Sune/Antisune composition notes** (H = Sune twice, Pi = Sune U Sune, etc.) were
  added as a second formula field, then as a note line, then in the case name —
  **all removed**. The user did not want them.
- **An F2L section** was built (11 cases, 3 groups, own diagram mask) and then
  **removed**. The `f2l` mask branch still exists in `colour()` and `update()` if
  it is ever wanted back.
- **Cube colours** were changed to "more natural" pigments and **reverted**; the
  current palette is the one the user wants.
- **Scramble "B/D bias"** was investigated: measured uniform over 400k moves
  (16.6–16.8% per face). Not a bug.
- **No `alert`/`confirm`** — artifact frames block modals. This broke "Clear
  session" once. Destructive actions use a two-step button; messages go to `#sync`.

---

## Verified

- All 18 formulas were checked programmatically: each solves the case it is
  labelled as, under some AUF, and none disturbs the first two layers. Verified
  with deliberately swapped references to prove the check can fail.
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
- The GitHub copy's baked defaults are a snapshot. Edits made in the Claude version
  afterwards must be carried over with Export/Import .json.
- Three-column layouts need ≥1250px; the current build only has two columns.
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
5. Full OLL (57) and PLL (21) behind a toggle — the engine already handles any case.
6. Right-hand mirror toggle for the whole page.
7. CSV export / csTimer import.
8. **CUBOTino integration**: the user has a CUBOTino-style robot interest and an
   ESP32-C3. Conclusion reached: a published artifact can never reach a device on
   the LAN (CSP), but a copy served *from* the device can. Split suggested — browser
   does the solving, ESP32-C3 drives the servos over WebSocket, no camera and no
   Kociemba on the C3 (needs an S3 for a camera; pruning tables don't fit in RAM).

---

## Maintenance rules

- **Bump `CACHE` in `sw.js`** on every `index.html` upload, or installed devices
  keep serving the old version.
- **Never touch `/*BAKED*/…/*END*/`** unless you intend to discard the user's saved
  formulas and marks.
- **Markup lives in the `SKELETON` string**, not in a visible `<body>`.
- Case ids are permanent keys for stored data.

---

## Repo contents

```
index.html              the app
manifest.json           PWA manifest
sw.js                   service worker (cache-first)
icon-192.png
icon-512.png
icon-512-maskable.png
README.md               install and deploy instructions
ARCHITECTURE.md         how the code works
STATUS.md               this file
```
