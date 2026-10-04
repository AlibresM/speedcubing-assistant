# CLAUDE.md

Before changing anything, read:

- `docs/STATUS.md`: what exists, decisions already made (don't re-litigate them), known limitations, ideas backlog.
- `docs/ARCHITECTURE.md`: how the code works (config, scripts, single-file builder, layout).

Hard rules (details in the docs):

- Formulas are **left-hand** on purpose. Never convert them to right-hand standards. F2L targets the front-left slot.
- Algorithm sets/cases live in `config.json`; its formulas, marks and collapsed groups are the user's own. Don't reset them.
- Case and set ids are permanent storage keys. Don't rename them. In a case with `algs`, the first variant is stored under the case id: don't reorder it; keep variant ids stable.
- Bump `CACHE` in `sw.js` whenever any app file changes; list new files in `ASSETS`.
- Scripts are classic (non-module) and carry `data-app`; the stylesheet carries `data-app-css`. The single-file builders depend on that.
- No `alert`/`confirm`/`prompt`; use two-step buttons and the `#sync` message area.
- Test over HTTP (`config.json` can't be fetched from `file://`); `node tools/build.js` for the single-file version.
