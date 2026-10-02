# CLAUDE.md

Before changing anything, read:

- `STATUS.md` — what exists, decisions already made (don't re-litigate them), known limitations, ideas backlog.
- `ARCHITECTURE.md` — how `index.html` is structured.

Hard rules (details in STATUS.md):

- Formulas are **left-hand** on purpose. Never convert them to right-hand standards.
- Bump `CACHE` in `sw.js` whenever `index.html` changes.
- Never edit the `/*BAKED*/…/*END*/` block unless the user asks to reset saved formulas/marks.
- Markup lives in the `SKELETON` string, not `<body>`.
- Case ids are permanent storage keys — don't rename them.
- No `alert`/`confirm`/`prompt`; use two-step buttons and the `#sync` message area.
