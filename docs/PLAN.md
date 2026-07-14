# VisSort — Project Plan

> Single source of truth for project direction. Task-level breakdown lives in [TODO.md](./TODO.md).
> Last updated: 2026-07-13 by team-leader.

## 1. Project Goal

VisSort is a modern, premium-feeling web application that visualizes classic sorting algorithms with smooth animated bars. Users pick an algorithm, generate or shuffle an array, and watch the sort unfold step by step — with full playback control (play/pause/step/speed), live statistics (comparisons, swaps, array accesses), and an educational info panel showing each algorithm's Big-O complexity and description.

**Quality bar:** this is not a toy demo. The result should look and feel like a polished product — refined visual design, fluid 60fps animations, responsive layout, dark/light theming, and keyboard accessibility.

## 2. Target Users

- **CS students** learning sorting algorithms for the first time — need clear step-by-step visuals and complexity info.
- **Educators** demonstrating algorithms in class — need large readable visuals, speed control, and step-through mode.
- **Interview preppers** refreshing algorithm intuition — need quick algorithm switching and comparison stats.
- **Curious developers** who enjoy well-crafted visual tools.

## 3. Feature List

### Core (Phase 1 — must ship)

| # | Feature | Notes |
|---|---------|-------|
| F1 | Algorithm selection | Bubble, Insertion, Selection, Merge, Quick, Heap |
| F2 | Animated bar visualization | Height-encoded values; smooth transitions; scales from ~5 to ~200 elements |
| F3 | Color-coded element states | default / comparing / swapping / pivot / overwriting / sorted — consistent across algorithms |
| F4 | Playback controls | Play, Pause, Step forward, Step backward, Reset — driven by a precomputed step sequence |
| F5 | Speed control | Slider from very slow (~1 step/s) to very fast (~200+ steps/s), adjustable mid-run |
| F6 | Array size control | Slider (~5–200 elements), regenerates array; disabled or safely handled mid-run |
| F7 | Array generation | Random shuffle + presets: nearly-sorted, reversed, few-unique |
| F8 | Live statistics | Comparisons, swaps/writes, array accesses, elapsed steps — updating in real time |
| F9 | Algorithm info panel | Name, description, Big-O (best/average/worst time + space), stability — per selected algorithm |
| F10 | Dark/light theme | Toggle + respects `prefers-color-scheme`; persisted in localStorage |
| F11 | Responsive layout | Desktop-first, fully usable on tablet and mobile |
| F12 | Keyboard shortcuts & a11y | Space = play/pause, arrows = step, reduced-motion support, ARIA labels, focus states |

### Stretch (Phase 1 — nice to have, clearly optional)

| # | Feature | Notes |
|---|---------|-------|
| S1 | Shell sort | Extra algorithm |
| S2 | Radix sort (LSD) | Extra algorithm; visualizes bucket passes (no swaps — writes only) |
| S3 | Sound mode | Pitch mapped to bar value on compare/swap (Web Audio API), off by default |
| S4 | Race mode | Two algorithms side by side on identical input, synchronized start |
| S5 | Custom array input | User types comma-separated values |
| S6 | Step scrubber | Timeline slider to jump to any step |

### Explicitly out of scope for Phase 1

- Accounts, saved sessions, sharing links (Phase 2 / backend)
- Server-side anything — the app is 100% client-side static
- Non-comparison exotic algorithms beyond radix (bogosort etc. — maybe as easter egg later)

## 4. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Build tool | **Vite** | Fast dev server, trivial static deploy |
| Framework | **React 18+** | Component model fits controls/panels; team default |
| Language | **TypeScript (strict)** | Type-safe step/event model is the backbone of the whole app |
| Styling | **Tailwind CSS** | Rapid, consistent styling with design tokens via CSS variables |
| Animation | CSS transforms + `requestAnimationFrame` driver | Bars are plain divs/rects; rAF loop consumes precomputed steps. No heavy animation lib needed; Framer Motion allowed for UI chrome only if frontend-dev finds it justified |
| State | React hooks + context (or Zustand if complexity warrants) | No server state; keep it light |
| Testing | **Vitest** + React Testing Library | Unit tests for algorithm step generators are mandatory |
| Lint/format | ESLint + Prettier | CI-enforceable quality gate |
| Deploy target | Static host (Netlify/Vercel/GitHub Pages) | Decided at end of Phase 1 |

### Architecture keystone: algorithms as step generators

Every algorithm is implemented as a **pure generator function** that takes an input array and yields a typed sequence of steps, e.g.:

```ts
type Step =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'overwrite'; index: number; value: number }   // merge/radix writes
  | { type: 'markPivot'; index: number }
  | { type: 'markSorted'; indices: number[] };
```

The visualization engine is a separate playback driver that consumes steps at the chosen speed. This separation means: algorithms are unit-testable without any DOM, step-back is possible (replay from snapshot or inverse ops), and race mode (S4) falls out almost for free.

## 5. Phase Breakdown

### Phase 1 — Frontend (NOW)

Everything above, 100% client-side. Milestones in order:

1. **M1 Design & scaffold** — design direction + tokens locked; Vite/React/TS/Tailwind project builds and lints clean.
2. **M2 Engine** — step model, all 6 core algorithm generators with unit tests, playback driver.
3. **M3 Visualization & controls** — bar canvas, color states, full control panel, stats, info panel.
4. **M4 Polish** — theming, responsive pass, a11y/keyboard, animation tuning, empty/edge states.
5. **M5 QA & release candidate** — full QA pass (build/lint/test/security/structure/README), stretch items only if M1–M4 are green.

### Phase 2 — Backend (LATER, not planned in detail yet)

Noted for awareness only — **no Phase 2 tasks exist in TODO.md**. Likely scope: user accounts, saved/shareable visualizer configs, community presets, telemetry. The frontend must not take on any speculative backend abstractions now; a clean static app is the deliverable.

## 6. Team & Responsibilities (Phase 1)

| Agent | Role this phase |
|-------|-----------------|
| ui-ux-designer | Design direction, tokens, layout spec, component specs, motion & state color spec |
| frontend-developer | Scaffold, algorithm engine, visualization, controls, stats, theming, responsiveness, a11y |
| backend-developer | **No tasks — Phase 2** |
| qa-tester | Build/lint/test verification, TODO acceptance audit, client-side security check, structure + README |
| team-leader | Owns PLAN.md/TODO.md, sequencing, verification of done-ness |

## 7. Definition of Done (Phase 1)

- All core features F1–F12 implemented and meeting their acceptance criteria in TODO.md.
- `npm run build`, `npm run lint`, and `npm test` all pass clean.
- Algorithm generators have unit tests proving each algorithm actually sorts (property: output sorted, is permutation of input) across random/sorted/reversed/duplicate/empty/single-element inputs.
- No console errors during a full user session; 60fps animation at 100 elements on a mid-range machine.
- README documents setup, scripts, architecture (step-generator model), and folder structure.
- QA sign-off recorded in TODO.md.
