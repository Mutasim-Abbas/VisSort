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

---

# Feature Plan — "Groups & Structure": Array view rebuild + Tree view rebuild

**Status:** planned 2026-07-29. Owner: team-leader.
**Scope:** the Visualizer's two non-3D view modes. The Crane (Columns) view is **frozen**.

## WS0. Why this exists

User verdict, verbatim: *"the array with tree according to the columns option they are
very bad i want u to make them a next level like make them real useful"*.

Follow-up answers from the user (**authoritative — do not re-litigate**):

1. **Goal:** *"Both, equally."* The Array and Tree views must be genuinely instructive
   **and** visually on par with the Crane. Neither is traded off against the other.
2. **Array view:** *"we can make it simple but have an idea like not just blocks divide no
   i want sth useful like divide the array into groups visually according to the sorting
   method."*
   Read: the array stays visually **simple** — no 3D, no ornament — but it must show the
   array's structure **as that specific algorithm sees it**, not a uniform row of cells.
   Algorithm-aware grouping is the core of the feature (see §WS4).
3. **Tree view:** *"full of bugs, remake it but make it well this time."*
   Read: **rebuild**, do not patch. The work starts by reproducing and cataloguing the
   real defects (§WS5.0) so the rebuild fixes them rather than guessing.
4. **Scope cut:** *"radix and shell no need for them in the project u can delete them
   totally."* Shell Sort and Radix Sort (LSD) are removed from the project entirely
   (§WS2). VisSort now ships **six** algorithms: Bubble, Insertion, Selection, Merge,
   Quick, Heap.

The current state: `ArrayView.tsx` is 95 lines that slide numbered cells between wrapped
grid slots; `TreeView.tsx` is 271 lines of flat SVG gated to three algorithms. Neither
tells a student *what the algorithm is doing or why*.

Both rebuilt views must answer, at every single step:

1. **How does this algorithm carve up the array right now?** Which cells belong to the
   sorted prefix, the unexamined tail, the `< pivot` partition, the live heap.
2. **Where are the algorithm's cursors?** `i`, `j`, `min`, the pivot, the write head, the
   heap root/child.
3. **What is the current comparison and what did it decide?** Not "these two are yellow" —
   the actual predicate `a[3] = 41 > a[4] = 12 -> swap`.
4. **What is the loop invariant, in one plain sentence?**
5. **(Tree) How does the tree relate to the array?** There is currently zero linkage
   between a tree node and the cells it owns.

## WS1. Non-negotiable design inputs

- **Palette:** the existing "quant lab" tokens in `src/styles/tokens.css` — amber-gold
  `--accent: #f5b417`, lime `--lime: #8ce046`, near-black bases `#06070a` to `#1f232f`,
  and the six bar-state hues (`--color-bar-default #4a5468`, `comparing #f5c518`,
  `swapping #ff6b4a`, `pivot #c77dff`, `overwriting #45c4ff`, `sorted #8ce046`).
  **No new palette. No hex literals in components.** New semantics become *token aliases*
  in `tokens.css` that resolve to existing values or a `color-mix()` of them.
- **Reference (the visual target):** `docs/DESIGN.md` §11 and `CraneView.tsx` itself —
  staged legible motion, overlay pills, a spoken action label, honest degradation notices.
  Array and Tree must feel like the same instrument rendered in 2D.
- **Type/motion:** `--font-mono` for all indices and values, `--font-display` for headings
  only, existing `--ease-*` / `--duration-*` tokens and the existing `--step-ms` variable.
- **Frozen:** `src/components/three/**` (including `CraneView.tsx` and `HeroScene.tsx`)
  must end this feature with **zero diff**.

## WS2. Scope cut — Shell Sort and Radix Sort removed

Removed entirely, per the user. Six algorithms remain: `bubble`, `insertion`, `selection`,
`merge`, `quick`, `heap`.

Code removal was performed ahead of this plan; what remains is verification plus the
doc/UI residue. Full touch-point list, to be confirmed one by one (see task WC1):

| Touch point | Expected state |
| --- | --- |
| `src/engine/algorithms/shell.ts`, `radix.ts` | deleted (confirmed) |
| `src/engine/registry.ts` — `AlgorithmKey`, imports, `ALGORITHMS` | six keys only (confirmed) |
| `src/engine/pseudocode.ts` — `PSEUDOCODE` record | six entries only (verify) |
| `src/engine/quiz.ts` | no shell/radix branches, quiz generates for all six (verify) |
| `src/engine/algorithms.test.ts` | shell/radix cases removed; the `writesModel === 'overwrite'` case now covers merge only (verify) |
| `src/engine/pseudo/lang.test.ts` | verify it does not enumerate the removed keys |
| `src/data/presets.ts` | verify nothing keyed by algorithm remains (confirmed modified) |
| `src/pages/Visualizer.tsx`, `Compare.tsx`, `Home.tsx`, `Gallery.tsx`, `Learn.tsx` | no shell/radix in dropdowns, race rosters, gallery cards, learn tabs, or deep-link `?algo=` handling (Visualizer/Compare/Home confirmed modified; **Gallery.tsx and Learn.tsx not yet touched — check them**) |
| `README.md` line ~34 | **still says "Shell, and Radix (LSD)" — must be fixed** |
| `docs/STRUCTURE.md` line ~34 | **still lists `shell.ts radix.ts` in the tree — must be fixed** |
| `docs/DESIGN.md` line ~379 | says "overwriting (merge/radix writes)" — reword to merge only |
| `docs/PLAN.md` / `docs/TODO.md` earlier sections | historical record; leave as-is, they describe past phases |
| `?algo=shell` / `?algo=radix` URLs | must fall back gracefully to `bubble`, not crash |

The suite had **239 passing tests** before the cut. It will now be lower; the requirement
is that every remaining test passes and none were weakened to make that true.

## WS3. Engine change — `StepContext` (additive, optional, zero-cost)

The **only** engine contract change in this feature. Specified once here so it is
implemented once. The central new idea is `groups` — the algorithm tells the view how it
carves up the array, because only the algorithm actually knows.

### WS3.1 Types (`src/engine/types.ts`)

```ts
/** How one contiguous run of positions is classified by the running algorithm. */
export type GroupKind =
  | 'ordered'      // sorted so far but NOT final (insertion's prefix)
  | 'unsorted'     // in play, no finer structure known
  | 'scanned'      // already examined during this pass
  | 'unexamined'   // not yet reached during this pass
  | 'lessThan'     // quicksort: proven < pivot
  | 'greaterThan'  // quicksort: proven >= pivot
  | 'pivot'        // quicksort: the pivot cell itself
  | 'merged'       // merge: destination slots already written this merge
  | 'heap'         // heapsort: the live max-heap
  | 'outside';     // not part of the call/pass currently executing

export interface Group {
  /** Inclusive position range. */
  lo: number;
  hi: number;
  kind: GroupKind;
  /** Short human label shown on the group's bracket, e.g. 'sorted so far', '< 41'. */
  label: string;
}

/**
 * Optional teaching context attached to a step. Purely descriptive: it never
 * touches the array, the counters, or replay. `applyStepsToArray` and
 * `accumulateStep` must continue to ignore everything except `type`.
 */
export interface StepContext {
  /**
   * How the algorithm currently carves up the array. INVARIANT: groups are
   * non-overlapping, sorted ascending by `lo`, and together cover exactly
   * 0…n-1. This is the field the Array view is built around.
   */
  groups?: readonly Group[];
  /**
   * Named cursors -> array positions. Keys are DISPLAY LABELS and must match the
   * identifiers in PSEUDOCODE[algorithm] ('i', 'j', 'min', 'end', 'k', 'root').
   * Keep keys <= 5 characters.
   */
  cursors?: Readonly<Record<string, number>>;
  /** Short phase label: 'Pass 2 of 7', 'Build max-heap', 'Merge 0-3'. */
  phase?: string;
  /** 1-based pass number (and total when known) for algorithms that run in passes. */
  pass?: { index: number; total?: number };
  /**
   * The two values ACTUALLY compared. Merge sort compares values held in scratch
   * buffers while overwriting the same range, so the highlighted cells may no
   * longer hold them. REQUIRED on every `compare` step.
   */
  values?: { a: number; b: number };
  /** Merge sort only: the merge in flight, so the view can draw both source runs. */
  merge?: {
    lo: number;
    mid: number;
    hi: number;
    /** Elements consumed from each half so far. */
    takeLeft: number;
    takeRight: number;
    /** Destination index the next write lands on. */
    write: number;
  };
}

export type Step = StepKind & { line?: number; ctx?: StepContext };
```

Rules:

- `ctx` is **optional everywhere**; nothing may throw or mis-render when it is absent.
- `ctx` objects are freshly allocated per step and never mutated after `yield`
  (determinism: `buildSteps(g, x)` twice must still deep-equal).
- **The "final" region is NOT a group kind.** It is derived by the view from
  `frame.state[id] === 'sorted'`, which the existing `markSorted` steps already drive.
  This prevents two sources of truth disagreeing.
- `accumulateStep`, `applyStepsToArray`, `Player`, `Frame` and `Counters` are
  **unchanged**. The views already receive `steps` and `frame.index`.

### WS3.2 Per-algorithm grouping — the substance of the feature

Implement exactly this. Positions are inclusive; empty ranges are omitted.

**Bubble** (pass `i`, scanning position `j`):

| range | kind | label |
| --- | --- | --- |
| `0 … j` | `scanned` | "swept this pass" |
| `j+1 … n-2-i` | `unexamined` | "not reached yet" |
| `n-1-i … n-1` | `outside` | "bubbled into place" (renders as final via frame state) |

Cursors: `{ i: j, 'i+1': j+1 }`. Phase: `Pass {i+1}`. Invariant: *"Everything from index
{n-1-i} rightwards is final; the largest value still in play is being pushed right."*

**Insertion** (outer `i`, travelling `j`):

| range | kind | label |
| --- | --- | --- |
| `0 … i` | `ordered` | "sorted so far — {v} sliding in" (during the slide) / "sorted so far" |
| `i+1 … n-1` | `unsorted` | "not yet inserted" |

Cursors: `{ i, j }`. Phase: `Pass {i} of {n-1}`. Invariant: *"a[0…{i-1}] is in order; {v}
is being slid back into it. Nothing here is final yet."* The `ordered` vs final
distinction is the whole point for insertion and must be visually different.

**Selection** (outer `i`, scan `j`, best `min`):

| range | kind | label |
| --- | --- | --- |
| `0 … i-1` | `outside` | "locked" (renders as final via frame state) |
| `i … j-1` | `scanned` | "searched — smallest so far is {a[min]}" |
| `j … n-1` | `unexamined` | "still to search" |

Cursors: `{ i, j, min }`. Phase: `Pass {i+1} of {n-1}`. Invariant: *"a[0…{i-1}] holds the
{i} smallest values, in order, permanently."*

**Quicksort** (call `lo…hi`, boundary `i`, scan `j`, pivot at `hi`):

| range | kind | label |
| --- | --- | --- |
| `0 … lo-1` | `outside` | "another branch" |
| `lo … i-1` | `lessThan` | "< {pivot}" |
| `i … j-1` | `greaterThan` | ">= {pivot}" |
| `j … hi-1` | `unexamined` | "not compared yet" |
| `hi … hi` | `pivot` | "pivot = {pivot}" |
| `hi+1 … n-1` | `outside` | "another branch" |

Cursors: `{ i, j, p: hi }`. Phase: `Partition {lo}-{hi}`. Invariant: *"Everything left of
{i} is < {pivot}; everything from {i} up to {j} is >= {pivot}."* This is the single best
teaching visual in the whole feature — the three coloured partitions growing and shrinking
live.

**Merge** (call `lo…hi`, `mid`, destination `k`):

Before the combine begins (divide phase): `0…lo-1` `outside`, `lo…hi` `unsorted`
("being split"), `hi+1…n-1` `outside`.

During the combine:

| range | kind | label |
| --- | --- | --- |
| `0 … lo-1` | `outside` | "another branch" |
| `lo … k-1` | `merged` | "merged, in order" |
| `k … hi` | `unexamined` | "destination — being overwritten" |
| `hi+1 … n-1` | `outside` | "another branch" |

Cursors: `{ k, L: lo+i, R: mid+1+j }`. Phase: `Merge {lo}-{hi}`. Plus `merge: {...}` so
the view can draw the **two source runs above the row** — the array's own cells cannot
show them, because merge overwrites in place. Invariant: *"a[{lo}…{mid}] and
a[{mid+1}…{hi}] were each sorted; they are being fused into a[{lo}…{hi}]."*

**Heapsort** (heap size `end`, sift-down `root`/`child`):

| range | kind | label |
| --- | --- | --- |
| `0 … end-1` | `heap` | "max-heap" |
| `end … n-1` | `outside` | "extracted" (renders as final via frame state) |

Cursors: build phase `{ root, child }`; extract phase `{ end, root, child }`.
Phase: `Build max-heap` / `Extract {k} of {n}`. Invariant: *"a[0…{end-1}] satisfies the
max-heap property; a[{end}…{n-1}] holds the largest values, final."*

Every `compare` step in all six algorithms must also carry `values: { a, b }` — the two
values it actually read.

### WS3.3 Derived helpers — new pure module `src/engine/stepContext.ts`

```ts
/** ctx of the step that produced the frame at `index` (steps[index-1]), or {}. */
export function contextAt(steps: readonly Step[], index: number): StepContext;

/**
 * What the comparison at index-1 decided, by looking ahead past any pure
 * annotation steps: 'swap' | 'write-left' | 'write-right' | 'keep' | null.
 */
export function compareOutcome(steps: readonly Step[], index: number): CompareOutcome;

/** One true sentence about the array's current state. Empty string if none applies. */
export function invariantOf(key: AlgorithmKey, ctx: StepContext, frame: Frame): string;

/**
 * Pass ladder over the WHOLE run: one row per ctx.pass with its step range,
 * comparisons, swaps and active window. Memoize on [steps].
 */
export function buildPassLadder(steps: readonly Step[]): PassRow[];
```

`invariantOf` copy must be written, not generic — use the eight sentences in §WS3.2 as the
quality bar. If no true invariant can be stated for a step, return `''`; never emit vague
filler. A false invariant is worse than none in a teaching tool.

### WS3.4 Test additions (new `src/engine/stepContext.test.ts`)

- **Group cover invariant:** for all six algorithms across every input shape already used
  in `algorithms.test.ts` (`empty`, `single`, `two-sorted`, `two-reversed`, `all-equal`,
  `small-random`, `duplicates`, and each preset at n = 5/17/64), every step's `ctx.groups`
  is non-overlapping, ascending by `lo`, in-bounds, and covers exactly `0…n-1`.
- **Group truth:** quicksort's `lessThan` group really contains only values `< pivot` and
  `greaterThan` only values `>= pivot`, checked against a replayed array. Insertion's
  `ordered` group is really non-decreasing. Heapsort's `heap` group really satisfies the
  max-heap property. These are the claims the view makes to a student; they must be tests.
- **Compare values:** every `compare` step carries `ctx.values` matching a faithful replay
  at that index.
- **No regression:** counters and replay results are identical to before `ctx` existed —
  `algorithms.test.ts` and `player.test.ts` pass **unmodified**. Selection at n=20 still
  does exactly 190 comparisons; merge still reports 0 swaps.
- **Determinism:** `buildSteps` twice deep-equals, `ctx` included.
- **Perf:** `buildPassLadder` on bubble at n=200 completes in under 50 ms.

## WS4. Array view rebuild — "the array, grouped the way the algorithm sees it"

`src/components/ArrayView.tsx` is rebuilt. New props: `algorithmKey`, `steps`, `onSeek`,
`onShrink`, plus the existing `frame`, `speed`, `statusLabel`.

**Design constraint from the user: keep it simple.** No 3D, no ornament, no glass stacking.
The visual interest comes from the *structure being true*, not from effects. What earns
"on par with the Crane" here is precision, legible motion and typography — the same
instrument, flattened.

Layout, top to bottom:

1. **Phase strip** — mono chips: `ctx.phase`, the pass counter, the step counter. Text
   changes animate; layout never jumps.
2. **Invariant line** — one sentence from `invariantOf()` in `--text-secondary`. This is
   the highest-value single element on the screen.
3. **Group brackets** — above the row, one labelled bracket per `ctx.group`, spanning its
   cells, with the group's label. Brackets resize as groups grow and shrink; they do not
   fade out and back in.
4. **Cursor rail** — one pill per `ctx.cursors` entry with a downward caret, sliding to its
   column over `--step-ms`. Lane-stacked when cursors collide. Each pill shows label and
   index (`j = 7`).
5. **The row itself — a SINGLE row, physically divided into groups.** Cells are keyed by
   bar id and still slide on swaps. The division is made physical:
   - an extra gap (~14 px) between adjacent groups, so the groups read as separate blocks
     rather than one uniform strip;
   - each group has its own tinted backing panel (kind-specific token alias) and a subtle
     inner border;
   - within a group, cells keep the existing `.cell-*` state colours for
     comparing/swapping/overwriting/pivot/sorted, which always win over the group tint;
   - the final region (from `frame.state === 'sorted'`) gets the lime treatment on the
     cells themselves, so "final" and "grouped" are two independent, non-conflicting
     channels;
   - each cell carries a proportional value fill (value / max) behind the number, tying
     this view back to the Columns bars.
6. **Index track** under the cells, with index labels under active cursor columns promoted
   to `--accent`.
7. **Comparison callout** — a small card anchored midway between the two compared cells:
   `a[3] = 41  >  a[4] = 12` with a large operator glyph and a verdict chip (`-> swap`
   tinted `--color-bar-swapping`, `-> keep` tinted `--lime`, `-> write left/right` tinted
   `--color-bar-overwriting`). Values from `ctx.values`, verdict from `compareOutcome()`.
   It slides to follow the comparison; it must not blink out and back in every step.
8. **Merge source runs** (merge sort only) — while `ctx.merge` is present, two faded run
   strips above the live row showing the left and right halves with consumed elements
   greyed out per `takeLeft`/`takeRight`, and the write head marking the destination. This
   fixes a real existing lie: merge's `compare` steps point at cells that have already
   been overwritten.
9. **Swap arc / write pulse** — on a swap, a low SVG arc between the two exchanging
   positions for the duration of the step, so a swap reads as an exchange rather than a
   teleport. On overwrite, a brief scale pulse. Both disabled at `SNAP_SPEED` and under
   reduced motion.
10. **Overflow handling** — the row no longer wraps. When it exceeds the container it
    scrolls horizontally with auto-follow (cursors kept on screen; a user scroll wins for
    3 s). A slim minimap strip of per-element ticks coloured by state, with a viewport
    rectangle, appears only when the row overflows. Below a computed 22 px cell width,
    values are hidden and cells become pure state chips, with a one-line notice offering
    "shrink to 24" via the existing `onShrink` callback (the same mechanism the Crane
    already uses — do not invent a second one).

## WS5. Tree view rebuild — "the structure"

### WS5.0 Bug catalogue first (mandatory, before any design or rebuild)

The user's words: *"full of bugs, remake it but make it well this time."* Task WT0
reproduces each defect in the browser and records the reproduction, so the rebuild is
verified against real failures. Starting list, found by inspection of
`src/components/TreeView.tsx` and `src/engine/treeModel.ts` — **confirm or refute each,
and add anything else found**:

| # | Defect | Where |
| --- | --- | --- |
| B1 | **Merge nodes never leave the "combining" state.** `merge.ts` emits `markSorted` only once, at the very end of the run. `RecursionTree` computes `allSorted` from per-position sorted state, so for the entire merge run no node is ever "done" — every completed merge stays blue, then the whole tree flips green on the last step. Quicksort, which marks each pivot sorted, behaves completely differently in the same component. | `TreeView.tsx` `allSorted` / `isCombining`; `algorithms/merge.ts` |
| B2 | **Heap tree layout is circular.** `levelH` is computed from the measured container `height`, but the container's height is determined by the SVG, whose height is `cy(n-1) + r + 12`, which depends on `levelH`. The measurement feeds its own input — the tree can jitter, settle wrong, or collapse. | `HeapTree`, `useElementSize` |
| B3 | **Negative geometry at small container heights.** `levelH = Math.min(72, (height - 40) / …)` goes negative when the container is under 40 px (cinema mode, mobile, first paint), stacking nodes upward off-canvas. | `HeapTree` |
| B4 | **Heap nodes overlap at large n.** `r = max(5, …)` but horizontal spacing is `width / 2^(depth-1)`. At n=200 that is ~7 px spacing with a 10 px node diameter. The "clearest with 63 or fewer" hint is advisory only; the view still renders an unreadable overlap. | `HeapTree` |
| B5 | **Extracted elements are still drawn inside the heap.** After each extraction the tail is no longer part of the heap, but `HeapTree` renders all n positions as heap nodes. The structure shown is not the structure the algorithm has. | `HeapTree` |
| B6 | **Quicksort's partition logic is duplicated.** `buildQuickSegments` re-implements `quick.ts`'s Lomuto partition. Two copies of the same logic = the tree can silently disagree with the animation. | `treeModel.ts` |
| B7 | **O(index) rescan every frame.** `useRecursionProgress` replays the step prefix on every frame, and `allSorted` scans each node's range per node per frame. At n=200 this is a per-frame cost proportional to the whole run. | `TreeView.tsx` |
| B8 | **Degenerate depth is unbounded.** Quicksort worst case gives depth ~n; at n=200 the SVG is ~5000 px tall with 14 px nodes and no cap, no zoom, no horizontal scroll. | `RecursionTree` |
| B9 | **Nodes are positioned by array range, not as a tree.** Children are placed at their `lo` proportion, so lopsided quicksort partitions produce edges that overlap their own parent and cross visually. | `RecursionTree` |
| B10 | **No pivot in the tree.** `markPivot` / `frame.pivotId` are ignored entirely, so a quicksort tree never shows what the partition was about. | `RecursionTree` |
| B11 | **`deepestContaining` is dead code** — exported from `treeModel.ts`, never used. | `treeModel.ts` |
| B12 | **Switching algorithm while on the Tree tab silently kicks the user to Columns**, because `TREE_CAPABLE` gates the mode. | `Visualizer.tsx`, `viewMode.ts` |
| B13 | **SVG uses `width="100%"` with pixel coordinates and no `viewBox`**, so between a resize and the next measurement the drawing and the box disagree. | both trees |

### WS5.1 The rebuild

`TreeView.tsx` becomes a thin shell; the work moves into
`src/components/tree/RecursionTree.tsx`, `tree/HeapTree.tsx`, `tree/PassLadder.tsx`, plus
a pure `src/engine/treeProgress.ts` for the derived model (memoized, not per-frame).

Shared shell, every algorithm:

- **Array ribbon pinned at the top** — a compact one-row strip of the live array in the
  same state colours as the Array view, with the active node's range bracketed on it.
  *This is the missing tree↔array link and is mandatory.*
- **Call-stack rail** down the left — breadcrumb chips root -> current node with depth
  numbers, making recursion depth and its ~log n bound explicit.
- **Depth guides** — faint horizontal rules per level, labelled `depth 0`, `depth 1` …
  with the node count at that level.
- Proper `viewBox`, capped depth, horizontal scroll when needed (fixes B8, B13).

Recursion tree (merge, quick):

- Nodes carry content, not a bare range label: the range **plus** a micro sparkline of the
  values they own, coloured by state — so leaves visibly become ordered runs and fuse.
- Four honest node states: **pending** (dashed, call not yet made), **active** (accent glow
  plus pop), **combining** (`--color-bar-overwriting` with a real progress fill from
  `ctx.merge`), **returned** (lime, subdued). Fixing B1 requires per-range completion to be
  derivable — either merge emits `markSorted` for each range as it finishes, **or**
  `treeProgress.ts` derives completion from the combine's write count reaching the range
  size. Prefer the derivation; if merge must emit per-range `markSorted`, that is a
  behaviour change to `merge.ts` and must be called out in the task and covered by tests.
- Quicksort nodes show the pivot value as a `--color-bar-pivot` chip and, once
  partitioned, split into `< pivot` / `pivot` / `> pivot` sub-segments (fixes B10).
- Layout is a real tree layout (children centred beneath their parent, siblings spaced by
  subtree width), not an array-range projection (fixes B9).
- Edges draw on (`stroke-dashoffset`) when a call opens and pulse in the return direction
  when a node completes. Deeper levels dim and shrink slightly; the active node sits on a
  soft radial accent glow.
- Quicksort's tree must be derived from the **actual emitted steps**, not a re-implemented
  partition (fixes B6). `buildQuickSegments` should be deleted or reduced to a test helper.

Heap tree (heap):

- Correct, non-circular layout computed from `n` and depth alone, with a `viewBox` (fixes
  B2, B3, B13) and a minimum node spacing that triggers the honest notice rather than
  overlapping (fixes B4).
- Only the live heap `0…end-1` is drawn as a tree; extracted elements move to a "final"
  strip below (fixes B5).
- The sift-down path is highlighted from the current root down through `ctx.cursors`.
- Each node is labelled with its array index, lining up with the ribbon above.
- A parent-vs-child comparison callout from `ctx.values`
  (`41 < 78 -> swap with the larger child`).

## WS6. Structure fallback for the three non-recursive algorithms

`TREE_CAPABLE` is retired; the switch label becomes **"Structure"** (mode id stays `tree`),
available for all six algorithms — this also fixes B12.

**bubble / insertion / selection** get a **pass ladder**: one row per `ctx.pass` showing
the pass number, its active window as a bar (visibly shrinking for bubble and selection,
growing for insertion's prefix), the comparisons and swaps in that pass, and a "you are
here" marker. Completed passes lime, current accent, future outlined. Rows are real
`<button>`s that seek playback to that pass's first step.

Opens with explicit honest copy, e.g. *"Bubble Sort is iterative — it has no recursion
tree. What it does have is passes, and here is every one of them."* Never a fake tree,
never an empty panel, never an apology.

## WS7. Performance and degradation

- `MAX_SIZE` is 200; bubble at n=200 emits roughly 40 k steps. `buildPassLadder` and the
  tree-progress model must be `useMemo`'d on `[steps]` alone and never recomputed per
  frame (fixes B7).
- Array view past ~n=60: the row overflows; minimap plus auto-follow carry it; sub-22 px
  cells drop values and show the shrink notice.
- Tree stays legible to n=64; above that the honest notice appears and depth is capped.
- Existing `SNAP_SPEED` behaviour is preserved: at high speed everything snaps via
  `.no-transitions`, including the new arcs, brackets, draw-on edges and callouts.
- No new dependencies. No canvas or WebGL in these views — SVG plus CSS transforms only.
  Everything animated must be `transform` or `opacity`.

## WS8. Accessibility

- Keep the `aria-live="polite"` status paragraph in both views.
- The invariant line, the group labels and the comparison callout must be real DOM text —
  they *are* the pedagogy — not `aria-hidden` decoration.
- `prefers-reduced-motion` disables arcs, draw-on edges and pops; colours and positions
  still update instantly, per the existing rules in `src/styles/views.css`.
- All new colour pairings hit WCAG AA; use `--on-state` for text on bright state fills.
- Pass-ladder rows are focusable `<button>`s with the standard `--focus-ring`.

## WS9. Definition of success

1. For all six algorithms, at any paused step, the Array view **divides the row into the
   groups that algorithm actually maintains**, labels each group, names every live cursor,
   marks the final region, states the invariant in words, and shows the current comparison
   with its verdict.
2. Quicksort's `< pivot` / `>= pivot` / unexamined partitions, insertion's ordered-but-not-
   final prefix, selection's searched-vs-unsearched split, merge's source runs and
   heapsort's live heap are each visible and each provably true (§WS3.4 tests).
3. The merge-sort comparison callout shows the values actually compared, verified against
   a replay — not stale positions.
4. Every defect B1–B13 is either fixed or explicitly refuted with evidence.
5. The Tree view links to the array via the ribbon, shows recursion depth on the call rail,
   never shows a call that has not happened, and never overlaps or overflows unreadably.
6. "Structure" is available for all six algorithms and never shows an empty panel or a
   fake tree.
7. Shell and Radix are gone from code, UI, tests **and docs**, with no dangling references
   and no broken deep links.
8. `npm run typecheck`, `lint`, `test`, `build` all green; remaining tests pass with no
   test weakened to achieve it.
9. `src/components/three/**` has **zero** diff.
10. qa-tester has driven all six algorithms in a real browser in both views, at the slowest
    and fastest speeds, at n = 5 / 16 / 64 / 200, and signed off.

## WS10. Risks

| Risk | Mitigation |
| --- | --- |
| Groups drift from what the algorithm really does — the view lies to a student | §WS3.4 asserts group truth against a replayed array, per algorithm, not just bounds |
| Fixing B1 tempts a change to `merge.ts` step output | Prefer deriving completion in `treeProgress.ts`; if `merge.ts` must change, it is called out and tested explicitly |
| "Simple" array view drifts into ornament, against the user's words | WD1 must state what is deliberately *not* added; code-reviewer checks it |
| Tree rebuild reintroduces the same layout bugs | WT0's reproductions become the acceptance checklist for WF4 |
| Scope creep across two rebuilds | Strict order WC1 -> WT0/WF1 -> WD1 -> WF2 -> WF3 -> WF4 -> WF5 -> WF6; WF5 is the first cut if time runs short |
| Perf collapse at n=200 from whole-run scans | `useMemo` on `[steps]`; qa measures at n=200 with the profiler |
| Shell/radix removal leaves dangling refs | WC1 walks the enumerated touch-point table in §WS2 item by item |
