# VisSort — Project Plan

> Single source of truth for project direction. Task-level breakdown lives in [TODO.md](./TODO.md).
> Last updated: 2026-07-13 by team-leader.
>
> **⚠️ Historical planning doc.** VisSort evolved beyond this original plan.
> As shipped it is a **5-page** experience (Home, Gallery, Visualizer, Compare,
> Learn), **dark-theme only** (the light theme was dropped), and has **no
> backend** (the app is fully client-side — Phase 2 was cancelled). It gained
> three view modes, a step-by-step recursion tree, a live pseudocode runner,
> practice quizzes, and sound. See [`../README.md`](../README.md) for the
> current feature set.

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

---

# Feature Plan — "3D Crane" view mode

> Added 2026-07-25 by team-leader. Additive feature on the shipped app. Owns its
> own task block in [TODO.md](./TODO.md) (`## Feature — 3D Crane view`).
> Requirements interview already completed by the main session; decisions below
> are settled — do not re-litigate scope.

## FC1. What we are building

A **new, fourth view mode** for the Visualizer — "Crane" — that sits alongside
the existing Columns (2D bars), Array, and Tree views. It is **not a
replacement**. It renders the sort as a physical **crane/gantry rig** lifting and
placing numbered 3D boxes on a shelf, directly inspired by the @algomaster.io
"Bubble Sort 3D" reel the user shared (reference frames extracted to the session
scratchpad `…/scratchpad/frames/f_001.png … f_010.png` — the designer must view
them). It must work for **all 8 algorithms**, not just bubble sort.

Anatomy, per the reel and frames:

- A **gantry rig** (two H-posts + a top rail) straddles a **shelf/platform**.
- On the shelf, one **3D box per array element**: box height = value, the value
  **printed on the box face**.
- A **claw/gripper on straps** hangs from a trolley on the top rail. On a swap it
  **descends → grips → lifts → travels → sets down**.
- **Box color states** map the reel's palette onto VisSort's own quant-lab tokens
  (we match VisSort, NOT the reel's exact hues — see FC4).
- A floating **predicate/action label** under the rig (`a[i] > a[j] ?` while
  comparing; `swap a[i], a[j]` while swapping).
- Glowing **complexity pills** (TIME / SPACE) above the rig.
- A **synced source-code panel** below, current line highlighted in lock-step.
- On completion: all boxes green, in sorted order, claw parked, a "Sorted!"
  flourish (frame f_010).

## FC2. Architectural approach — reuse the engine untouched

**Non-negotiable: the engine (`src/engine/`) is not modified.** The crane view is
a pure consumer of the exact same `Frame` the 2D views already receive. The
`Frame` (see `src/engine/player.ts`) is keyed by **stable bar id** and already
carries everything a 3D scene needs:

- `heights[id]` → box height (normalize to max value, exactly like `BarCanvas`).
- `posOf[id]` → the box's shelf slot (0…n-1) → its x on the shelf.
- `state[id]` (`comparing|swapping|overwriting|pivot|sorted|default`) → box color.
- `pivotId`, `counters`, `index`, `total` → highlights, stats, progress.

**Choreography cue without engine changes:** the crane needs to know *which* step
just happened to swing the claw. That is `steps[frame.index - 1]` — the exact
pattern the existing narration and sound side-effects already use in
`Visualizer.tsx`. The `Frame` has *already applied* the step (boxes hold their
post-step positions/heights), so the scene **lerps each box from its currently
rendered transform toward its target** (target-driven interpolation, the same
technique `HeroScene.tsx` uses), while the claw is choreographed on top to read as
the cause of the motion. No inverse ops, no new step types, no player changes.

The view is passed the same props `TreeView` already gets — `frame`, `speed`,
`status`, `statusLabel`, plus `steps`, `algorithmKey`, and `array` — so precedent
for the prop shape exists.

## FC3. Step → animation mapping (covers all 8 algorithms)

The mapping is **per step type**, so it is automatically correct for every
algorithm — swap-model (bubble, insertion, selection, quick, heap, shell) and
overwrite-model (merge, radix) alike. No per-algorithm choreography code.

| Step | Crane behaviour | Label shown |
|---|---|---|
| `compare{i,j}` | Claw idles/retracts; the two boxes glow **comparing** (amber). | `a[i] > a[j] ?` (mono, muted) |
| `swap{i,j}` | Claw travels over the pair, descends, grips; one box arcs up-over to the other slot while its partner slides across; sets down. Both boxes glow **swapping**. | `swap a[i], a[j]` (amber) |
| `overwrite{index,value}` | Claw descends at `index` and sets down a re-valued box; box **morphs height** to the new value, glows **overwriting** (blue). | `write value → a[index]` |
| `markPivot{index}` | Box gets the distinct **pivot** highlight (purple) + a persistent marker; claw idle. | `pivot = a[index]` |
| `markSorted{indices}` | Those boxes turn **sorted** (lime) and lock; claw idle. | (none) |
| `divide` / `combine` | **Ignored** by this view (tree-view annotations; no array effect). | — |

Per-algorithm reality check (all 8 covered by the table above):
- **bubble / insertion / selection / quick / heap / shell** → swap-model: compares
  glow pairs, swaps drive the claw pick-and-place. Quick additionally shows the
  pivot highlight; heap's long-range swaps are the same claw arc over a longer
  travel; shell's gapped swaps likewise (just a wider arc).
- **merge / radix** → overwrite-model: no swaps; every write is a claw set-down of
  a re-valued box (height morph). Radix never compares, so its box glows stay on
  writes — consistent with its "swaps = 0" story elsewhere in the app.

## FC4. Palette mapping — VisSort tokens, not the reel's colors

Map the reel's semantics onto the existing `--color-bar-*` / accent tokens in
`src/styles/tokens.css` (dark-theme only — the app is dark-only):

| Reel meaning | Reel color | VisSort token |
|---|---|---|
| idle / unsorted box | blue-grey | `--color-bar-default` (#4a5468) |
| comparing | blue | `--color-bar-comparing` (amber #f5c518) |
| active / lifted / moving | amber | `--color-bar-swapping` (#ff6b4a) for the swap glow; the claw/rig in `--accent` amber |
| sorted / locked | green | `--color-bar-sorted` (lime #8ce046) |
| pivot | (n/a in reel) | `--color-bar-pivot` (#c77dff) |
| overwrite/write | (n/a in reel) | `--color-bar-overwriting` (#45c4ff) |

The rig/gantry uses neutral surface tones (`--bg-surface-*`, `--border-strong`);
the shelf reads as brushed metal. Emissive/glow only on the ≤ a few active boxes
(comparing/swapping/pivot) — never on all boxes at once (perf). Result: the reel's
staging in VisSort's own quant-lab identity, not a color clone.

## FC5. Performance & degradation (portrait reel had 8 boxes; VisSort allows 5–200)

The array-size slider ranges **5–200** (`MIN_SIZE`/`MAX_SIZE`). Numbered 3D boxes
under a physical crane are only readable and only choreographable at **small**
counts. Policy (decided — implement as written):

- **`CRANE_MAX = 32`.** Full 3D staging renders for `n ≤ 32`.
- **Number labels shown at `n ≤ 20`**, auto-hidden above (faces get unreadable).
- **`n > CRANE_MAX`:** the crane canvas shows a non-destructive notice
  ("The 3D Crane is clearest with ≤ 20 boxes") with a **"Shrink to 16 boxes"**
  button that sets the size — VisSort never silently mutates the user's data; the
  user clicks. Other views stay available. (Do **not** auto-truncate the array.)
- **Snap-at-speed:** the pick-and-place choreography is a *per-step* animation and
  cannot play at 40 steps/s. At **speed ≥ 20 steps/s** (the same `SNAP_SPEED`
  threshold `BarCanvas` already uses), the claw parks and boxes **snap** to their
  target positions/heights each step — correct behaviour, not a bug. Full
  choreography plays in slow/step mode where it is legible.
- **GPU discipline:** one shared box geometry/material set (reuse, not per-box new
  materials); `dpr={[1,2]}` clamp like `HeroScene`; `ContactShadows` (cheap) not
  per-box shadow maps at high count; dispose all three.js resources on unmount /
  mode-switch so repeatedly toggling modes never leaks WebGL contexts.
- **`prefers-reduced-motion`:** no claw swoop, no box arcs, no float/idle drift —
  boxes cross-fade/snap to state and position; state stays legible via color. The
  completion flourish becomes a static color+label change (no confetti/scale).
- Target **55–60fps at `n = 32`** on a mid-range laptop.

## FC6. Overlays (the reel's chrome)

1. **Complexity pills** above the rig: `TIME O(…)` + `SPACE O(…)`, glowing, in the
   quant-lab pill style. TIME shows **average-case** time from
   `algorithm.complexity.average` (the honest "typical" value; labeled so it is
   unambiguous), SPACE shows `.space`. (Low-stakes — see open questions.)
2. **Action label** under the rig, from `steps[frame.index-1]` per FC3.
3. **Synced code panel** below: reuse the existing line-highlight technique from
   `CodeRunner.tsx` (`steps[frame.index-1]?.line` → highlight + `scrollIntoView`).
   Source is VisSort's existing `PSEUDOCODE[algorithmKey]` (consistent with the
   Learn and Tree views), **not** the reel's Python. This keeps the app internally
   consistent and needs no new content.
4. **Completion flourish** (frame f_010): on `status === 'done'`, all boxes are
   already lime; add a "Sorted!" label and a brief celebratory beat (optional light
   confetti/box bob), with the reduced-motion fallback from FC5.
5. **Cinema mode** (the Visualizer already has one that hides side panels): the
   crane should fill the taller stage in cinema mode — this is the closest thing to
   the full-screen reel and is a natural showcase.

## FC7. Layout & responsive

- Normal mode: crane occupies the same hero slot the other views use (the
  `viewMode ===` branch in `Visualizer.tsx`), side panels intact.
- Cinema mode: full-height stage.
- Mobile: the 3D canvas scales down; number labels follow the `n ≤ 20` rule;
  complexity pills wrap; code panel scrolls. Camera is a **fixed** gently-angled
  3/4 view (subtle optional idle drift, off under reduced-motion). Drag-to-orbit is
  an optional stretch, not required — teaching clarity beats interactivity.

## FC8. Registration surface (small, contained)

Only three files wire view modes, so registration is tightly scoped:
- `src/components/viewMode.ts` — add `'crane'` to the `ViewMode` union (+ any
  capability constant if we gate by size rather than always-on).
- `src/components/ViewModeSwitch.tsx` — add the "Crane" option (enabled for all 8
  algorithms — unlike Tree, it is not algorithm-gated).
- `src/pages/Visualizer.tsx` — render `<CraneView … />` on `viewMode === 'crane'`,
  passing `frame/speed/status/statusLabel/steps/algorithmKey/array`.

New code lives under `src/components/three/` (alongside `HeroScene.tsx`), e.g.
`CraneView.tsx` + sub-components (`CraneRig`, `ValueBox`, `Claw`) and an HTML
overlay layer for pills/label/code.

## FC9. Team & skip decisions for this feature

| Agent | This feature |
|---|---|
| ui-ux-designer | Crane visual + motion + choreography spec → append to `docs/DESIGN.md` |
| frontend-developer | Everything in FC2–FC8 |
| **backend-developer** | **SKIP** — pure client-side, no API/DB/auth/data source |
| **devops-engineer** | **SKIP** — additive, no new deps (three/fiber/drei already installed), no env/secret/CI changes; existing Vercel + GH Pages deploy is unaffected |
| code-reviewer | Adversarial review of the diff (engine untouched, leaks, perf, tokens) |
| qa-tester | Real-browser e2e across all 8 algorithms + build/lint/test + sign-off |

## FC10. Definition of done (this feature)

- "Crane" is a selectable 4th view mode, working for **all 8 algorithms**.
- Swaps animate as claw pick-and-place; overwrites as re-valued set-downs;
  compares glow pairs with the predicate label; pivots highlighted; sorted boxes
  lock lime; completion flourish plays.
- Snap-at-speed and reduced-motion fallbacks behave per FC5.
- `n > 32` shows the non-destructive shrink notice; no silent data mutation.
- Engine (`src/engine/`) is byte-for-byte unchanged; colors are token-only.
- No WebGL context leak across repeated mode switches; 55–60fps at n=32.
- `npm run build`, `npm run lint`, `npm test` green; qa-tester signs off in TODO.

## FC11. Open questions (non-blocking — proceeding on the defaults below)

1. **Code panel source** — using VisSort's existing `PSEUDOCODE` (default) for app
   consistency, rather than reproducing the reel's literal Python. Confirm if the
   user specifically wants Python-style source in this view.
2. **TIME pill value** — showing **average-case** time, labeled. If the user
   prefers worst-case (the reel's single `O(n²)` for bubble reads as worst), it is
   a one-line change.

Neither blocks design or build; both are cosmetic and reversible.
