# VisSort

A cinematic, interactive **sorting-algorithm visualizer** built for teaching and
learning. Watch eight classic algorithms work step by step — in three different
views — with live statistics, adjustable speed, sound, and pseudocode that
executes in lock-step with the animation.

**▶ Live: https://mutasim2004abs-create.github.io/VisSort/**

_Designed & built by **Mutasim Abbas**._

---

## What it does

VisSort is a five-page single-page app. Everything runs in the browser — there
is no backend.

- **Home** — a 3D (Three.js) hero introducing the project.
- **Gallery** — pick an algorithm from cards, each running its own live
  mini-preview.
- **Visualizer** — the main tool (see below).
- **Compare** — race two algorithms on the _same_ array under one clock, with a
  head-to-head scoreboard and an execution-scaling chart measured live in the
  browser.
- **Learn** — for every algorithm: description, complexity, **pseudocode that
  runs with the executing line highlighted**, and a **Practice** quiz whose
  answers are generated from a real run (so they can never disagree with the
  visualizer).

## Features

- **8 algorithms** — Bubble, Insertion, Selection, Merge, Quicksort, Heapsort,
  Shell, and Radix (LSD).
- **Three views** — **Columns** (animated bars), **Array** (numbered cells that
  slide between indexed slots), and **Tree** (the recursion tree for merge /
  quick that is _built step by step as the algorithm divides_, and the binary
  heap tree for heapsort).
- **Your own numbers** — type any list; the app never invents data for you (it
  opens on a proper empty state). Presets (random / nearly-sorted / reversed /
  few-unique) and sizes 5–200 are there too.
- **Full playback** — play / pause, step forward, step back, reset, and a live
  speed control. Stepping is fully reversible, and every statistic
  (comparisons, swaps, writes, accesses) is derived from the step stream, so it
  stays exactly correct when you scrub backward.
- **Sound** — optional, pleasant Web Audio tones pitched to each value, with a
  completion chord (off by default).
- **Cinematic dark UI** — liquid-glass chrome, Instrument Serif display type,
  word-by-word blur-in headlines, cursor spotlight, film grain, and page
  transitions.
- **Accessible & responsive** — labelled controls, ARIA live status, visible
  focus rings, ≥44px touch targets, a mobile menu, and `prefers-reduced-motion`
  support.

## Keyboard shortcuts (Visualizer)

| Key     | Action       |
| ------- | ------------ |
| `Space` | Play / pause |
| `→`     | Step forward |
| `←`     | Step back    |
| `R`     | Reset        |

Shortcuts are ignored while a form control is focused.

## How it works

Every algorithm is a **pure step generator**: given an input array it yields a
deterministic sequence of typed steps (`compare`, `swap`, `overwrite`,
`markPivot`, `markSorted`, `divide`, `combine`) and never touches the DOM. Each
step also records the **pseudocode line** that produced it. A separate
`requestAnimationFrame` driver replays the steps over a visual model, and all
statistics — and the live code highlighting — are derived from the step stream.

This separation is what makes reversible stepping, scrub-correct counters, the
step-by-step recursion tree, and exhaustive unit testing straightforward.
**239 tests** cover algorithm correctness across input shapes, counter
cross-checks, the divide/combine annotations, and the pseudocode line mapping.

See [`docs/PLAN.md`](docs/PLAN.md), [`docs/DESIGN.md`](docs/DESIGN.md), and
[`docs/STRUCTURE.md`](docs/STRUCTURE.md) for the full architecture.

## Getting started

```bash
npm install     # install dependencies
npm run dev     # start the dev server → http://localhost:5173
```

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run build`   | Type-check and build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally                  |
| `npm test`        | Run the Vitest test suite                             |
| `npm run lint`    | Run ESLint                                            |
| `npm run format`  | Format the codebase with Prettier                     |

## Tech stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Three.js /
@react-three/fiber · React Router · Vitest + React Testing Library · ESLint +
Prettier. Deployed to GitHub Pages via GitHub Actions (which type-checks, lints,
tests, and builds before every deploy).

## Notes

- **No backend / no data collection.** The app is fully client-side; there are
  no accounts, no secrets, and nothing is persisted server-side.
- `npm audit` reports advisories **only in dev tooling** (the esbuild
  dev-server class of issue). These never reach the deployed `dist/` output;
  production dependencies are clean.
