# VisSort

A modern, interactive **sorting algorithm visualizer**. Watch classic sorting
algorithms work step by step — play, pause, scrub back and forth, adjust speed
and array size, and read live statistics (comparisons, swaps, writes, array
accesses) alongside each algorithm's Big-O complexity.

> **Status:** Phase 1 (frontend) complete. The backend (accounts, saved
> configurations, sharing) is planned for Phase 2 — see [`docs/PLAN.md`](docs/PLAN.md).

## Features

- **8 algorithms** — Bubble, Insertion, Selection, Merge, Quicksort, Heapsort,
  Shell, and Radix (LSD).
- **Full playback control** — play/pause, step forward, step back, reset, and a
  live speed slider (1–200 steps/s). Stepping is fully reversible.
- **Animated bar canvas** with six colour-coded states (unsorted, comparing,
  swapping, writing, pivot, sorted), a pivot marker, and a completion sweep.
- **Live statistics** derived from the step stream, so they stay exactly correct
  when you scrub backward and forward.
- **Per-algorithm info panel** — description, best/average/worst/space
  complexity, and stability.
- **Data presets** — random, nearly-sorted, reversed, and few-unique, with an
  array size of 5–200.
- **Dark / light themes** with OS-preference default, no flash on load, and
  persistence across reloads.
- **Accessible & responsive** — keyboard shortcuts, ARIA live status, visible
  focus rings, ≥44px touch targets, and `prefers-reduced-motion` support.

## Getting started

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
```

### Other scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run build`    | Type-check and build the production bundle to `dist/`|
| `npm run preview`  | Preview the production build locally                 |
| `npm test`         | Run the Vitest test suite                            |
| `npm run lint`     | Run ESLint                                           |
| `npm run format`   | Format the codebase with Prettier                   |

## Keyboard shortcuts

| Key            | Action          |
| -------------- | --------------- |
| `Space`        | Play / pause    |
| `→`            | Step forward    |
| `←`            | Step back       |
| `R`            | Reset           |

(Shortcuts are ignored while a form control is focused.)

## How it works

Every algorithm is a **pure step generator** — given an input array it yields a
deterministic sequence of typed steps (`compare`, `swap`, `overwrite`,
`markPivot`, `markSorted`) and never touches the DOM. A separate
`requestAnimationFrame` playback driver replays those steps over a visual model,
and all statistics are derived from the step stream. This separation is what
makes reversible stepping, scrub-correct counters, and exhaustive unit testing
straightforward. See [`docs/PLAN.md`](docs/PLAN.md) and
[`docs/DESIGN.md`](docs/DESIGN.md) for the full architecture and design system.

## Tech stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Vitest + React Testing
Library · ESLint + Prettier.

## Project structure

See [`docs/STRUCTURE.md`](docs/STRUCTURE.md).

## Security notes (client-side app)

- No secrets or credentials are stored in the repo; there is no backend in
  Phase 1. `.env*` files are git-ignored.
- No `dangerouslySetInnerHTML`, `eval`, or untrusted HTML rendering is used.
- `npm audit` currently reports advisories **only in dev tooling**
  (vitest / vite / vite-node — the esbuild dev-server class of issue). These do
  not affect the production `dist/` output that gets deployed. Clearing them
  requires a major (breaking) bump of Vitest, deferred to a later dependency
  update.
