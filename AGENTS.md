# Working on react-italy-map

Instructions for coding agents developing this library. Guidance for agents *using* the library is in [`llms.txt`](llms.txt).

## Commands

```bash
npm test           # vitest (jsdom)
npm run typecheck  # tsc over src, demo, examples, test
npm run build      # tsc + library build → dist/
npm run dev        # demo site (demo/ + examples/), imports the package from src via aliases
npm run build:demo # demo → demo-dist/ (deployed to GitHub Pages from main), includes llms.txt
npm run size       # bundle size per import; update the README table if it moves
npm run geo        # regenerate src/data from ISTAT boundaries (downloads, cached in scripts/.cache)
```

Before finishing a change: `npm test`, `npm run typecheck`, `npm run build`.

## Layout

- `src/core/MapView.tsx` — the one map engine: rendering, selection, hover/tooltip, gestures, imperative handle. The three public maps are thin wrappers that choose areas, index and defaults.
- `src/core/useViewBox.ts` — zoom/pan state of the SVG viewBox.
- `src/core/areas.ts`, `keys.ts` — id normalisation and the id → code index. A new id variant goes in `keys.ts` (or in `aliases` via `scripts/build-geo.mjs`).
- `src/core/styles.ts` — CSS inlined in every map, scoped to `.rim`, themed via `--rim-*` variables.
- `src/data/*` — **generated** by `scripts/build-geo.mjs`; never edit by hand.
- Entry points: `src/index.ts` (regions, Legend, helpers) and `src/provinces.ts` (province maps). Keep province geometry out of the main entry.

## Conventions

- No runtime dependencies. Library code must stay SSR-safe (no `window` / `document` at module or render level) and tree-shakable (`sideEffects: false`, one output file per module).
- Match the existing style: 4-space indent, terse comments explaining *why*, no comment banners beyond the existing `// ── Section ──` ones.
- Public props and types are documented with JSDoc in `src/types.ts` or the component's props interface; those comments ship in the `.d.ts`.
- A user-visible change updates `README.md` and, when it affects how the library is used, `llms.txt`. Keep `llms.txt` to verified facts: it is what other agents trust.
- Every user-visible change gets a line in `CHANGELOG.md` (under `## Unreleased` until a version is cut). Releases bump `package.json` and title the commit like `Short description (1.2.0)`.

## Tests

- `test/ItalyMap.test.tsx` — behaviour tests.
- `test/brute.test.tsx` — adversarial edge cases. Tests marked `it.fails` are **known open issues**: when you fix one, the test starts failing — remove the `.fails` marker.
- jsdom has gaps (pointer capture, real layout, `XMLSerializer` namespace quirks). Verify gesture, focus and export changes in a real browser with `npm run dev`.
