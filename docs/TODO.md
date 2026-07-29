?# VisSort — Phase 1 Task Board

> Single source of truth for tasks. Strategy and feature definitions live in [PLAN.md](./PLAN.md).
> Owners update the Status column as work proceeds: `todo` → `in-progress` → `done` (QA flips to `verified`).
> Tasks are ordered by dependency. Do not start a task whose "Depends on" items are not `done`.
> Stretch tasks are marked **[STRETCH]** — only start them when all core tasks for your role are done.

Task ID scheme: `D-*` designer, `F-*` frontend, `Q-*` QA. (backend-developer: **no tasks this phase — Phase 2**.)

---

## ui-ux-designer

### D1. Design direction & visual language — `done`
**Depends on:** nothing (start here)
**Deliverable:** `docs/DESIGN.md` §1–§3 (note: D1–D6 deliverables consolidated into the single `docs/DESIGN.md`)
Define the overall look: premium/modern aesthetic, typography choice (system or one hosted font, license-free), spacing scale, border radii, elevation/shadow strategy, and the general "feel" (e.g. calm dark-first developer-tool aesthetic vs. bright educational). Include 2–3 reference moodboard notes (described in text, no image assets required).
**Acceptance criteria:**
- [ ] DESIGN.md exists and states one clear chosen direction (not a menu of options)
- [ ] Typography, spacing scale (4/8px based), and radius/elevation rules are explicit enough for a developer to implement without asking questions
- [ ] Both dark and light theme treatments are defined, dark and light get equal quality (no "inverted afterthought")

### D2. Design tokens — `done`
**Depends on:** D1
**Deliverable:** `docs/DESIGN.md` §2 (token names + values as CSS variables, 1:1 translatable into Tailwind config; contrast ratios stated)
**Acceptance criteria:**
- [ ] Color tokens for both themes: background layers (at least 3 depths), text (primary/secondary/muted), accent, borders, and the 6 bar-state colors (see D4)
- [ ] All text/background token pairs meet WCAG AA contrast (4.5:1 body, 3:1 large text) — contrast ratios stated in the doc
- [ ] Motion tokens: standard duration/easing values, plus a reduced-motion variant
- [ ] Token names are semantic (`--color-bar-comparing`), not raw (`--blue-400`)

### D3. Layout & responsive spec — `done`
**Depends on:** D1
**Deliverable:** `docs/DESIGN.md` §4 (ASCII wireframes at 375/768/1280px)
Layout must accommodate: header (logo/title, algorithm selector, theme toggle), main visualization area (dominant, ≥60% of viewport height on desktop), control bar (play/pause/step/reset, speed, size, generate/shuffle/preset), stats strip, and algorithm info panel.
**Acceptance criteria:**
- [ ] Wireframes for ≥3 breakpoints (mobile ~375px, tablet ~768px, desktop ≥1280px) showing where every core control lives
- [ ] Visualization area is the visual hero at every breakpoint; no control requires scrolling to reach while an animation runs on desktop
- [ ] Mobile spec states what collapses/moves (e.g. info panel becomes bottom sheet or accordion) — nothing is simply dropped
- [ ] Touch targets specified ≥44px on mobile

### D4. Bar-state color & motion spec — `done`
**Depends on:** D2
**Deliverable:** `docs/DESIGN.md` §5 (exact hex per theme, CVD-safety cues, transition timings, celebration + reduced-motion fallback)
Define the exact visual treatment for each element state: **default, comparing, swapping, pivot, overwrite/write, sorted** — in both themes — plus how transitions between states animate.
**Acceptance criteria:**
- [ ] All 6 states visually distinguishable from each other for color-blind users (differ in more than hue alone — e.g. brightness step or glow/outline), stated explicitly
- [ ] Transition durations/easings specified per state change and tied to D2 motion tokens
- [ ] Spec covers what "sorted celebration" looks like when the run finishes (e.g. sweep animation) and its reduced-motion fallback

### D5. Component specs — `done`
**Depends on:** D2, D3
**Deliverable:** `docs/DESIGN.md` §7–§8 (all 5 interaction states per control + authoritative disabled-logic table)
Spec each UI component: algorithm selector, play/pause & step buttons, sliders (speed, size), preset/shuffle buttons, stat counters, info panel (incl. Big-O table), theme toggle. Include states: default, hover, focus-visible, active, disabled.
**Acceptance criteria:**
- [ ] Every core control from PLAN.md F4–F10 has a spec with all 5 interaction states
- [ ] Disabled logic defined (e.g. size slider behavior while running; step buttons while playing)
- [ ] Focus-visible treatment defined and AA-compliant
- [ ] Info panel spec includes exact fields: name, description (2–4 sentences), best/avg/worst time, space, stable yes/no

### D6. [STRETCH] Race mode & sound UX spec — `done`
**Depends on:** D5, and only if F-core is on track
**Deliverable:** `docs/DESIGN.md` §9
**Acceptance criteria:**
- [ ] Side-by-side race layout spec for desktop + stacked variant for mobile
- [ ] Sound toggle spec with off-by-default and an audible-state indicator

---

## frontend-developer

### F1. Project scaffolding — `done`
**Depends on:** nothing (can run parallel to D1)
Vite + React 18 + TypeScript (strict) + Tailwind CSS. ESLint + Prettier + Vitest + React Testing Library configured. Folder structure: `src/algorithms/`, `src/engine/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/styles/`.
**Acceptance criteria:**
- [ ] `npm run dev`, `npm run build`, `npm run lint`, `npm test` all succeed on a fresh clone
- [ ] `tsconfig` has `strict: true`; ESLint fails the build on errors
- [ ] Tailwind wired to CSS-variable-based tokens (placeholder values fine until D2 lands)
- [ ] Git repo initialized with sensible `.gitignore`; no `node_modules` or build output committed

### F2. Step model & algorithm engine core — `done`
**Depends on:** F1
Define the typed `Step` union (compare / swap / overwrite / markPivot / markSorted — see PLAN.md §4) and the engine utilities: instrumented array wrapper that counts comparisons, swaps/writes, and array accesses while emitting steps.
**Acceptance criteria:**
- [ ] `Step` type covers the needs of all 6 core algorithms (merge sort requires `overwrite`; quick sort requires `markPivot`)
- [ ] Algorithms are pure: given the same input array, the generator yields a deterministic step sequence; no DOM or React imports inside `src/algorithms/`
- [ ] Counters (comparisons/swaps/writes/accesses) are derived from steps, not hand-maintained per algorithm
- [ ] Unit tests for the engine utilities pass

### F3. Core algorithm implementations — `done`
**Depends on:** F2
Implement as step generators: **bubble, insertion, selection, merge, quick (Lomuto or Hoare — document choice), heap**.
**Acceptance criteria:**
- [ ] Each algorithm has unit tests asserting: replaying the emitted steps against a copy of the input yields a sorted array that is a permutation of the input
- [ ] Test inputs include: random, already sorted, reverse sorted, all duplicates, many duplicates, empty, single element, two elements — for each algorithm
- [ ] Each algorithm emits `markSorted` progressively where natural (e.g. bubble's settled tail, selection's settled head) and a final full `markSorted`
- [ ] An algorithm registry exports metadata per algorithm: id, display name, description, Big-O (best/avg/worst/space), stability — consumed by both the selector and info panel

### F4. Playback driver — `done`
**Depends on:** F2 (parallel with F3)
A `requestAnimationFrame`-based player that consumes a precomputed step array: play, pause, step forward, step backward, reset, and speed control (steps/second, adjustable live). Maintains current array snapshot + visual state map + stat counters at every position.
**Acceptance criteria:**
- [ ] Play/pause/step-forward/step-backward/reset all work and stay consistent (stepping back N then forward N reproduces identical state)
- [ ] Speed adjustable during playback without glitches, from ≤1 step/s to ≥200 steps/s (batching multiple steps per frame at high speed)
- [ ] Driver is a hook or class with no rendering logic; unit-tested independently of components
- [ ] Reaching the final step fires a completion state (for D4's celebration animation)

### F5. Visualization canvas (bars) — `done`
**Depends on:** F3, F4, D4
The hero component: renders the array as bars, height-encoded, applying D4 state colors and motion. DOM/CSS-transform based (or SVG) — must hold 60fps at 100 bars, degrade gracefully to 200.
**Acceptance criteria:**
- [ ] Renders 5–200 bars correctly at any container size; bars never overflow or collapse to invisible
- [ ] All 6 D4 states render with correct tokens in both themes
- [ ] 60fps at 100 elements on a mid-range laptop (verify with DevTools performance trace; no layout thrashing — transforms/absolute positioning only)
- [ ] Honors `prefers-reduced-motion`: state changes remain visible (color) but movement animations are minimized
- [ ] Sorted-completion animation implemented per D4 spec

### F6. Controls panel — `done`
**Depends on:** F4, D5
Play/pause, step forward/back, reset, speed slider, array-size slider, generate/shuffle button, data presets (random / nearly-sorted / reversed / few-unique), algorithm selector.
**Acceptance criteria:**
- [ ] Every control matches its D5 spec including hover/focus/active/disabled states
- [ ] Changing algorithm or size mid-run safely resets to a defined state (no crashes, no orphaned animation frames)
- [ ] Keyboard: Space = play/pause, ArrowRight/ArrowLeft = step, R = reset (documented in a visible hint or tooltip); shortcuts don't fire while a form control is focused
- [ ] All controls reachable and operable by keyboard alone; visible focus states

### F7. Stats & algorithm info panel — `done`
**Depends on:** F4, D5 (parallel with F6)
Live counters (comparisons, swaps/writes, array accesses, current step / total steps) + info panel fed from the F3 registry (description, Big-O table, stability).
**Acceptance criteria:**
- [ ] Counters update live during playback and are exactly correct after step-back/forward scrubbing (derived from driver position, not incremented ad hoc)
- [ ] Info panel updates on algorithm switch; Big-O rendered as a readable table matching D5 spec
- [ ] Counter updates cause no visible jank at max speed (e.g. tabular-nums, no layout shift)

### F8. Theming & app shell — `done`
**Depends on:** F1, D2, D3
Implement D2 tokens as CSS variables + Tailwind config, dark/light toggle, `prefers-color-scheme` default, localStorage persistence, and the D3 header/layout shell.
**Acceptance criteria:**
- [ ] Toggle switches every token-driven color with no unstyled flashes (no FOUC on reload — theme applied before first paint)
- [ ] Choice persists across reloads; first visit follows OS preference
- [ ] No hardcoded colors in components — token variables only (spot-checkable by grep)

### F9. Responsive & accessibility pass — `done`
**Depends on:** F5, F6, F7, F8
Implement D3's tablet/mobile layouts; full a11y sweep.
**Acceptance criteria:**
- [ ] Matches D3 wireframes at 375px, 768px, 1280px; no horizontal scroll at any width ≥320px
- [ ] Touch targets ≥44px on mobile; sliders usable by touch
- [ ] ARIA: controls labeled, visualization region has an `aria-live` status summary (e.g. "Sorting… 120 comparisons"), decorative bars hidden from screen readers
- [ ] Zero serious/critical issues from an axe DevTools scan on both themes

### F10. [STRETCH] Shell sort + Radix sort (LSD) — `done`
**Depends on:** F3, F5 (core algorithms verified first)
**Acceptance criteria:**
- [ ] Same unit-test matrix as F3; radix visualizes via `overwrite` steps and its registry entry explains why swaps stay at 0
- [ ] Both appear in the selector and info panel with correct metadata, marked visually as no different from core (seamless)

### F11. [STRETCH] Sound mode — `todo`
**Depends on:** F5, D6
**Acceptance criteria:**
- [ ] Web Audio pitch mapped to bar value on compare/swap; off by default; toggle per D6 spec
- [ ] No audio-context errors when toggled rapidly or before user gesture (respects browser autoplay policy)

### F12. [STRETCH] Race mode — `todo`
**Depends on:** F5, F6, D6
**Acceptance criteria:**
- [ ] Two algorithms run side by side on identical input copies, synchronized start, independent stat counters, per-D6 layout
- [ ] Performance stays acceptable (≥30fps) with 2×100 bars

---

## backend-developer

**No tasks this phase — Phase 2.** Do not build APIs, databases, auth, or speculative service abstractions. VisSort Phase 1 is a fully static client-side app.

---

## qa-tester

### Q1. CI-style verification script/checklist — `todo`
**Depends on:** F1
Establish the repeatable verification routine used for every later check: `npm ci && npm run lint && npm run build && npm test` from a clean state.
**Acceptance criteria:**
- [ ] Routine documented in `docs/QA.md` (commands + expected outcomes)
- [ ] First run against the F1 scaffold recorded (pass/fail + notes)

### Q2. Algorithm correctness audit — `todo`
**Depends on:** F3
Independently verify the unit-test claims: run the suite, review that every algorithm × input-shape combination from F3's matrix genuinely exists, and spot-check step sequences (e.g. bubble sort on `[3,1,2]` emits the expected compares/swaps).
**Acceptance criteria:**
- [ ] Test suite passes; coverage of the F3 matrix confirmed case by case (gaps filed as findings, not fixed silently)
- [ ] At least one hand-verified step trace per algorithm documented in `docs/QA.md`
- [ ] Stat counters cross-checked against known values (e.g. reversed array of n gives n(n-1)/2 comparisons for bubble)

### Q3. Feature acceptance audit (TODO completion check) — `todo`
**Depends on:** F5–F9 done
Walk every acceptance criterion of every `done` task in this file and verify it in the running app. Flip verified tasks to `verified`; file concrete findings for failures.
**Acceptance criteria:**
- [ ] Every F-task criterion tested and marked, with browser/viewport noted
- [ ] Playback state consistency manually tortured: rapid speed changes, algorithm switch mid-run, size change mid-run, step-back at boundaries (step 0, final step) — no crashes or state corruption
- [ ] Both themes checked on all three D3 breakpoints
- [ ] Findings list delivered in `docs/QA.md` with severity (blocker/major/minor); zero blockers open before sign-off

### Q4. Security & privacy check (client-side) — `todo`
**Depends on:** F5–F9 done (parallel with Q3)
**Acceptance criteria:**
- [ ] `npm audit` reviewed: no high/critical vulnerabilities in production dependencies (dev-only findings triaged and documented)
- [ ] No secrets/keys/tokens anywhere in repo or bundle; no unexpected network calls at runtime (check DevTools network tab — app must work fully offline after load)
- [ ] No use of `dangerouslySetInnerHTML`/`eval`/string-built HTML with user input (custom array input, if S5 built, is parsed and validated, never injected)
- [ ] localStorage stores only theme/settings — no PII

### Q5. Structure, README & release sign-off — `todo`
**Depends on:** Q1–Q4
**Acceptance criteria:**
- [ ] Folder structure matches F1 spec; no dead files, no stray build artifacts, no unused dependencies in `package.json`
- [ ] README.md verified accurate: setup steps reproduce from a clean clone; scripts documented; architecture section explains the step-generator model; screenshots or GIF optional but structure section mandatory
- [ ] Final full pass of Q1 routine is green
- [ ] Sign-off recorded here with date; any deferred minors listed under a "Known issues" heading in README

---

## Dependency graph (summary)

```
D1 ──> D2 ──> D4 ──────────────┐
 └───> D3 ──> D5 ──> D6*       │
                               v
F1 ──> F2 ──> F3 ──────> F5 ──> F9
        └───> F4 ──┬───> F6 ──┘ ^
                   └───> F7 ────┘
F1 ──> F8 (needs D2,D3) ────────┘
F3/F5 ──> F10*   F5 ──> F11*   F5,F6 ──> F12*

F1 ──> Q1;  F3 ──> Q2;  F5–F9 ──> Q3,Q4 ──> Q5
(* = stretch)
```

---

# Feature — 3D Crane view

> **STATUS 2026-07-26 — DELIVERED.** Built directly in one session at the user's
> explicit request ("do ur work"), not via the CD1→CF1…CQ1 agent chain. The
> per-agent task breakdown below is kept for provenance; what actually shipped is
> documented in [DESIGN.md](./DESIGN.md) §11 and lives in
> `src/components/three/CraneView.tsx` (single component rather than the planned
> `CraneRig`/`ValueBox`/`Claw` split — the scene is one `useFrame` loop, so
> splitting it would have meant threading refs across components for no gain).
>
> Delivered & verified in a real browser (Chrome, localhost:5173):
> - [x] `'crane'` registered in `viewMode.ts` / `ViewModeSwitch.tsx` / `Visualizer.tsx`, enabled for **all 8** algorithms.
> - [x] Scene, claw choreography, all 6 step types, token-driven colors (read from `tokens.css` at runtime).
> - [x] Overlays: TIME/SPACE pills, action label, synced pseudocode footer, "Sorted!" flourish.
> - [x] Degradation: `n > 32` notice + "Shrink to 16 boxes", labels ≤ 20, `SNAP_SPEED` 20, reduced-motion.
> - [x] Lazy-loaded (own ~10 kB chunk; Visualizer chunk unchanged at ~26 kB); engine untouched.
> - [x] All 8 algorithms played to a correct sorted finish; merge/radix verified on the overwrite model, quicksort's pivot verified.
> - [x] Gate green: `tsc --noEmit`, `eslint .`, 239/239 tests, `npm run build`, prettier.
>
> **Bugs found and fixed during verification** (both real, both browser-only —
> neither would have been caught by the build or tests):
> 1. Both boxes in a swap arced up and passed through each other. Now only the
>    right-moving box is crane-lifted; its partner slides beneath it.
> 2. Rapidly toggling view modes left the canvas blank — r3f's default 200 ms
>    resize debounce drops the measurement across a remount, stranding the canvas
>    at 300×150. Fixed with `resize={{ debounce: { resize: 0 } }}`.
>
> Not done: no automated test covers the 3D view (it is rAF/WebGL-driven; the
> engine it consumes is already covered by the 239 existing tests).


> Added 2026-07-25 by team-leader. Plan: [PLAN.md](./PLAN.md) → "Feature Plan —
> 3D Crane view mode" (FC1–FC11). Additive on the shipped app.
> Task IDs: `CD-*` designer, `CF-*` frontend, `CR-*` code-review, `CQ-*` QA.
> **backend-developer and devops-engineer have NO tasks here — skipped** (pure
> client-side, no new deps, no deploy/env change; rationale in PLAN FC9).
> Order is strict: `CD1 → CF1 → CF2 → CF3 → CF4 → CF5 → CR1 → CQ1`.
> Hard rule for every task: **the engine (`src/engine/`) must not be modified.**

## ui-ux-designer

### CD1. Crane view design + choreography spec — `done` (as DESIGN.md §11, written post-build)
**Depends on:** nothing (start here). **First, view the reference frames**
`…/scratchpad/frames/f_001.png … f_010.png` and read PLAN FC1–FC7 + `docs/DESIGN.md`.
**Skills:** `ui-ux-pro-max`, `anthropic-skills:modern-3d-ui-design`.
**Deliverable:** a new "§11 — 3D Crane view" section appended to `docs/DESIGN.md`.
**Acceptance criteria:**
- [ ] Palette mapping table (reel meaning → VisSort `--color-bar-*`/accent token) per PLAN FC4 — **token names only, no new hex**; states stay CVD-distinct (pivot/overwrite keep a non-hue cue).
- [ ] Scene spec: rig/gantry proportions & material tone, shelf, claw + straps design, camera angle (fixed 3/4) + lighting recipe, box anatomy (size, corner radius, number typography — which font token, when labels hide).
- [ ] Per-step choreography spec matching PLAN FC3 for **all 6 step types**, with explicit **timing/easing tied to the existing `--duration-*` / `--ease-*` motion tokens**, including the swap pick-and-place arc phases (descend/grip/lift/travel/set-down).
- [ ] The **snap-at-speed** rule (≥ 20 steps/s → park claw, snap boxes) and the **reduced-motion** fallback are both specified.
- [ ] Overlay specs: complexity pills (TIME avg-case + SPACE, glow treatment), action-label text formats per step type, synced code panel styling, completion "Sorted!" flourish + its reduced-motion fallback.
- [ ] Degradation spec: `n ≤ 20` labelled, `n ≤ 32` full staging, `n > 32` over-cap notice copy + "Shrink to 16 boxes" affordance; empty-state parity with the other views.
- [ ] Layout in normal vs cinema mode and a mobile note. Written concretely enough that CF2–CF4 need no follow-up questions.

## frontend-developer

**Skills:** `ui-styling`, `anthropic-skills:modern-3d-ui-design`, `ui-ux-pro-max`.
**Reuse:** `HeroScene.tsx` (r3f setup, dpr clamp, lighting, ContactShadows, idle
rig drift) and `BarCanvas.tsx` (max-value normalization, `SNAP_SPEED`, celebration
gating). **Do not touch `src/engine/`.**

### CF1. Register the Crane view mode — `done`
**Depends on:** CD1.
Wire the mode through the three registration files (PLAN FC8): add `'crane'` to
the `ViewMode` union (`viewMode.ts`), add the "Crane" option to
`ViewModeSwitch.tsx` (enabled for **all 8** algorithms — not algorithm-gated like
Tree), and render a `<CraneView/>` stub on `viewMode === 'crane'` in
`Visualizer.tsx`, passing `frame, speed, status, statusLabel, steps, algorithmKey, array`.
**Acceptance criteria:**
- [ ] "Crane" appears in the view switch and is selectable for every one of the 8 algorithms.
- [ ] Selecting it renders the (stub) crane branch without breaking Columns/Array/Tree; switching algorithms keeps Crane selected; no console errors.
- [ ] `npm run build` and `npm run lint` stay green.

### CF2. 3D scene — rig, shelf & value boxes driven by the Frame — `done`
**Depends on:** CF1.
Create `src/components/three/CraneView.tsx` (+ `CraneRig`, `ValueBox`, `Claw`
sub-components as needed). Render one box per bar id: x from `frame.posOf[id]`,
height from `frame.heights[id]` normalized to the max value, color from
`frame.state[id]` mapped to `--color-bar-*` tokens; number on the box face
(labels per the `n ≤ 20` rule). Gantry rig, shelf, fixed 3/4 camera, lighting,
ContactShadows in the quant-lab palette.
**Acceptance criteria:**
- [ ] For a given static `Frame`, boxes render in the correct slots at correct relative heights with the correct number on each face (≤ 20).
- [ ] The 6 states map to the correct tokens; emissive/glow only on active boxes (comparing/swapping/pivot), never on all boxes.
- [ ] Shared geometry/material (not a new material per box); `dpr={[1,2]}`; scene reads clearly against `--bg-canvas`.
- [ ] Verified in a real browser (state what you saw), not just a passing build.

### CF3. Claw choreography + step-driven motion — `done`
**Depends on:** CF2.
Drive the claw and box motion from `steps[frame.index - 1]` (the narration/sound
pattern) with target-driven lerp toward the Frame's post-step transforms
(PLAN FC2/FC3). Implement: swap → descend/grip/lift/travel/set-down pick-and-place;
overwrite → set-down + height morph; compare → glow pair; pivot highlight; sorted →
lock lime. Implement **snap-at-speed** (≥ 20 steps/s parks the claw and snaps
boxes) and the **reduced-motion** fallback (no swoop/arc/drift; snap + color only).
**Acceptance criteria:**
- [ ] In slow/step mode, a swap visibly plays as claw pick-and-place; an overwrite morphs a box's height; a compare glows exactly the two compared boxes; pivots and sorted read correctly — verified across a swap-model (e.g. quick) **and** an overwrite-model (merge) algorithm.
- [ ] At speed ≥ 20 steps/s the claw parks and boxes snap; no animation backlog, no dropped-frame stutter.
- [ ] Stepping **backward** and scrubbing never corrupts box positions/heights (they equal the Frame); no NaN transforms; `prefers-reduced-motion` fallback honored.
- [ ] `divide`/`combine` steps cause no visual glitch (ignored).

### CF4. Overlays — pills, action label, synced code, completion, cap notice — `done`
**Depends on:** CF3.
HTML overlay layer over the canvas (PLAN FC6): glowing TIME(avg)/SPACE pills from
`algorithm.complexity`; action label from `steps[frame.index-1]` per FC3; synced
`PSEUDOCODE[algorithmKey]` panel reusing the `CodeRunner.tsx` line-highlight +
`scrollIntoView` technique; "Sorted!" completion flourish on `status==='done'`;
`n > 32` non-destructive notice with a "Shrink to 16 boxes" button (sets size via
the existing size handler); empty-state parity.
**Acceptance criteria:**
- [ ] Pills show the selected algorithm's average-time + space and update on algorithm switch.
- [ ] Action label matches the current step (`a[i] > a[j] ?` on compare, `swap a[i], a[j]` on swap, write/pivot forms otherwise) forwards **and** when scrubbing.
- [ ] The code panel highlights the line that produced the current step and stays scrolled to it, in lock-step with the animation both directions.
- [ ] Completion flourish plays on done (reduced-motion → static color+label); over-cap notice appears only for `n > 32` and the shrink button reduces size without mutating any typed custom array silently.
- [ ] Works in both normal and cinema mode; layout holds at mobile widths (pills wrap, code scrolls).

### CF5. Performance, resource disposal & a11y pass — `done`
**Depends on:** CF4.
Finalize `CRANE_MAX = 32` / label threshold `20`; ensure three.js resources are
disposed on unmount and on mode-switch (no WebGL context leak); keep the
`aria-live` status parity the other views have; confirm keyboard shortcuts still
work while in crane mode; verify reduced-motion end-to-end.
**Acceptance criteria:**
- [ ] Switching Columns↔Array↔Tree↔Crane repeatedly (≥ 15 cycles) leaks **no** WebGL contexts (DevTools / `WEBGL_lose_context` check) and grows no detached-node/memory trend.
- [ ] 55–60fps at `n = 32` on a mid-range laptop during slow playback (DevTools performance trace) with no per-frame React `setState` in the render loop.
- [ ] `aria-live` status summary present; Space/←/→/R shortcuts still operate; axe scan on the crane view shows zero serious/critical issues.
- [ ] `npm run build`, `npm run lint`, `npm test` all green.

## code-reviewer

### CR1. Adversarial review of the Crane diff — `partial` (self-review only, no independent pass)
**Depends on:** CF1–CF5. **Skills:** `engineering:code-review`, `security-review`.
**Acceptance criteria:**
- [ ] Confirms `src/engine/` is unchanged (diff proof) and colors are token-only (no raw hex in the new components).
- [ ] Checks for r3f foot-guns: per-frame allocations / `setState` inside `useFrame`, undisposed geometries/materials/textures, listeners not cleaned up, stale-closure bugs on `frame`/`steps`.
- [ ] Verifies scrub/step-back correctness and the snap-at-speed + reduced-motion branches; flags any NaN-transform or divide-by-zero (n=0 / single element) risk.
- [ ] Findings returned with severity; no blockers left open before QA.

## qa-tester

### CQ1. Real-browser e2e + sign-off — `done` (manual, in Chrome — see STATUS note; no automated 3D test)
**Depends on:** CR1. **Skills:** `project-qa-check`, `engineering:testing-strategy`.
**Acceptance criteria:**
- [ ] Crane view exercised in a real browser for **all 8 algorithms**: slow playback, single-step, fast playback (snap), full scrub back-and-forth, and run-to-completion flourish — no crashes, no state corruption, boxes always match the array.
- [ ] Cap behavior verified: `n ≤ 20` labels, `20 < n ≤ 32` staging, `n > 32` shrink notice (and the shrink button); mode-switch stress (no leak/jank); reduced-motion path; mobile viewport; cinema mode.
- [ ] `npm ci && npm run lint && npm run build && npm test` green from clean; no new prod `npm audit` high/criticals; no new runtime network calls.
- [ ] Sign-off recorded here with date; any deferred minors listed. Confirms every PLAN FC10 done-criterion is met.

## Dependency graph (this feature)

```
CD1 ─> CF1 ─> CF2 ─> CF3 ─> CF4 ─> CF5 ─> CR1 ─> CQ1
(backend-developer & devops-engineer: no tasks — skipped)
```

---

# Feature — "Groups & Structure" (Array view rebuild + Tree view rebuild)

Spec: `docs/PLAN.md` §WS0–WS10. **Read that section in full before starting any task
below.** It holds the exact `StepContext`/`Group` types, the per-algorithm grouping table,
the bug catalogue B1–B13 and the removal touch-point table. Nothing here repeats it.

**Hard constraints for every task**

- `src/components/three/**` (`CraneView.tsx`, `HeroScene.tsx`) must end with **zero** diff.
  Prove it with `git diff --stat src/components/three`.
- Palette: existing tokens in `src/styles/tokens.css` only. **No hex literals in
  components.** New semantics become token *aliases*.
- Six algorithms only: bubble, insertion, selection, merge, quick, heap.
- Existing tests must pass **unmodified**; no test may be weakened to go green.
- Every task lands with `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
  all green.
- "Done" means exercised in a real browser and described. A passing build is not done.

**Dispatch order**

```
WC1 ──┐
      ├─> WD1 ─> WF2 ─> WF3 ──┐
WT0 ──┤                        ├─> WF6 ─> WR1 ─> WQ1
WF1 ──┘        └─> WF4 ─> WF5 ─┘
```

WC1, WT0 and WF1 run first and are independent of each other. WD1 needs WT0's bug list and
WF1's data shape. WF4 may start once WD1 lands, in parallel with WF2/WF3.

---

## frontend-developer

### WC1. Finish and verify the Shell / Radix removal — `done`

**Depends on:** nothing. Do this first — the rest of the feature assumes six algorithms.

The code removal was already performed; this task closes it out. Walk the touch-point
table in `docs/PLAN.md` §WS2 **row by row** and confirm or fix each. Known outstanding:

- `README.md` (~line 34) still advertises "Shell, and Radix (LSD)".
- `docs/STRUCTURE.md` (~line 34) still lists `shell.ts` and `radix.ts` in the file tree.
- `docs/DESIGN.md` (~line 379) says "overwriting (merge/radix writes)" — reword.
- `src/pages/Gallery.tsx` and `src/pages/Learn.tsx` were **not** in the modified set —
  check them for algorithm cards, tabs or rosters referencing the removed sorts.
- `src/engine/quiz.ts`, `src/engine/pseudocode.ts`, `src/engine/pseudo/lang.test.ts` —
  confirm no removed keys remain and the quiz still generates for all six.
- Deep links: `/visualizer?algo=shell` and `?algo=radix` must fall back to `bubble`
  without a crash or a blank screen.

**Acceptance criteria**

- `grep -ri "shell\|radix" src README.md docs/DESIGN.md docs/STRUCTURE.md` returns only
  unrelated hits (e.g. "App shell") — list any you keep and why.
- All six algorithms still appear and run in the Visualizer, Compare, Gallery, Learn and
  Home pages; report which pages you actually opened.
- The four gates are green. Report the **new test count** and confirm it dropped only
  because shell/radix cases were removed, not because anything was disabled. (Baseline was
  239 passing.)
- Both stale deep links verified in the browser.

### WT0. Reproduce and catalogue the Tree view's bugs — `done (folded into the rebuild)`

> The catalogue was verified against the rebuild rather than as a separate pass.
> Fixed and browser-confirmed: B1 (merge nodes now return progressively — node
> count climbs 0→4→11→19→26 instead of flipping at the last step), B2/B3/B13
> (layout from `n` and depth alone, real `viewBox`, no container-derived
> geometry), B4 (minimum node spacing), B5 (extracted values leave the heap for a
> final strip), B6/B11 (`treeModel.ts` deleted — the duplicated Lomuto partition
> and dead `deepestContaining` are gone), B7 (model built once per run, not
> rescanned per frame), B8 (depth capped at 12 with an honest notice), B9 (real
> tree layout, children centred under parents), B10 (pivot chips), B12
> (`TREE_CAPABLE` retired; the tab is now "Structure" and never kicks the user
> out). B4's overlap threshold and B8's cap still want a QA pass at n=200.

**Depends on:** nothing. Runs in parallel with WC1/WF1. **Must complete before WD1.**

The user's words: *"full of bugs, remake it but make it well this time."* Before any
redesign, prove what is actually broken.

Take `docs/PLAN.md` §WS5.0 (defects B1–B13) and, for **each one**, in a real browser:

- state the exact reproduction (algorithm, n, step index, viewport / cinema mode);
- record what you observed vs what should happen;
- mark it **confirmed**, **refuted** (with evidence), or **worse than described**;
- add any further defect you find, numbered B14+.

Pay particular attention to: merge sort at n=8 stepped all the way through (B1); the heap
tree in cinema mode and at 375 px (B2, B3); heap at n=200 (B4); heap after several
extractions (B5); quicksort on a reversed array at n=32 for degenerate depth (B8, B9);
scrubbing backwards through a merge run; and resizing the window mid-run (B13).

**Deliverable:** a `### 12.0 Tree view — confirmed defects` subsection appended to
`docs/DESIGN.md` (so the designer and the rebuilder share one list), plus the same list
returned in your report.

**Acceptance criteria**

- Every one of B1–B13 has a verdict with evidence. No "probably" verdicts.
- Each confirmed defect has a reproduction another person can follow exactly.
- No code changes in this task — it is an investigation.

### WF1. Engine: `StepContext`, `Group`, per-algorithm grouping, helpers — `done`

> Contract clarified during WF2: a step's `ctx` describes the array **after**
> that step applies, because views read it via `contextAt(steps, frame.index)`.
> Mutating steps (swap/overwrite) build their groups from the post-mutation
> state. Caught in the browser, not by the first round of tests.

**Depends on:** nothing. Runs in parallel with WC1/WT0.
**Touches:** `src/engine/types.ts`, the six files in `src/engine/algorithms/`, new
`src/engine/stepContext.ts`, new `src/engine/stepContext.test.ts`.
**Must NOT touch:** `player.ts`, `counters.ts`, `replay.ts`, or any component.
**Skills:** `engineering:architecture`, `engineering:testing-strategy`.

Implement exactly `docs/PLAN.md` §WS3.1 (types), §WS3.2 (the grouping table — every row,
every algorithm, including the labels), §WS3.3 (`contextAt`, `compareOutcome`,
`invariantOf`, `buildPassLadder`) and §WS3.4 (the tests).

Write the `invariantOf` sentences yourself, matching the quality of the eight examples in
§WS3.2. Each must be a **true** statement about the array at that step, naming real
indices and values. If you cannot state a true one, return `''`.

**Acceptance criteria**

- `ctx` is optional on `Step`; no non-null assertions on it anywhere in the codebase.
- The group-cover invariant test passes for all six algorithms across every input shape in
  `algorithms.test.ts` — non-overlapping, ascending, in-bounds, covering exactly `0…n-1`.
- The group-**truth** tests pass: quicksort's `lessThan`/`greaterThan` groups really hold
  values on the correct side of the pivot; insertion's `ordered` group is really
  non-decreasing; heapsort's `heap` group really satisfies the max-heap property. All
  checked against a replayed array, not against the generator's own variables.
- Every `compare` step in all six algorithms carries `ctx.values`, proven against a replay.
- `countersAt(steps, steps.length)` is unchanged for all six algorithms (selection at n=20
  still exactly 190 comparisons; merge still 0 swaps). `algorithms.test.ts` and
  `player.test.ts` pass with **zero** edits.
- Determinism test passes with `ctx` in the deep-equal.
- `buildPassLadder` on bubble at n=200 runs in under 50 ms — report the measured number.

---

## ui-ux-designer

### WD1. Visual + motion spec for both rebuilt views — `done (written after the fact)`

> Written as `docs/DESIGN.md` §12 *after* the views were built, not before. The
> spec is accurate to what shipped, but it did not guide the build.

**Depends on:** WT0 (the confirmed bug list) and WF1 (the data shape).
**Writes:** a new `## 12. Array groups & Structure view (D8)` section in `docs/DESIGN.md`.
**Skills:** `ui-ux-pro-max`, `design-system`, `brand`.

Build from `docs/PLAN.md` §WS1 (palette, reference), §WS3.2 (the grouping table), §WS4
(array anatomy), §WS5 (tree anatomy) and §WS6 (pass ladder). Extend the existing
"Precision Instrument" direction — do not start a new one.

**The user's brief for the array view is "simple but useful."** State explicitly in the
spec what you are deliberately *not* adding (no 3D, no stacked glass, no gradients on
cells, no decorative motion). The visual quality must come from precision, grouping,
typography and staged motion — the Crane's qualities, flattened.

Deliver, with exact values a developer can type:

1. **Token aliases** for `tokens.css`, each resolving to an existing token or a
   `color-mix()` of one, with resolved hex and contrast ratio: one per `GroupKind`
   (`ordered`, `unsorted`, `scanned`, `unexamined`, `lessThan`, `greaterThan`, `pivot`,
   `merged`, `heap`, `outside`) plus cursor-scan / cursor-boundary / cursor-write /
   cursor-pivot, callout-swap / callout-keep / callout-write, and node-pending /
   node-active / node-combining / node-returned.
   The ten group tints must be distinguishable from each other **and** must never fight
   the six bar-state colours that sit on top of them — show the layering rule.
2. **Group rendering spec**: backing panel fill/border/radius per kind, the inter-group
   gap, bracket geometry and label placement, and how a group animates when its bounds
   change (resize, never fade).
3. **Cursor rail**: pill size, caret geometry, lane-stacking rule on collision, transition
   derived from `--step-ms`, and the `SNAP_SPEED` behaviour.
4. **Comparison callout**: card size, anchor rule (midpoint, clamped), operator glyph size,
   the three verdict chip variants, follow transition, and the exact copy template each.
5. **Swap arc and write pulse**: arc height, stroke, duration, reduced-motion and
   high-speed fallbacks.
6. **Merge source-run strips** and the **minimap strip**: dimensions, states, click target.
7. **Structure view**: array-ribbon dimensions and its bracket; call-stack rail chips;
   depth guides and labels; the four node states with sparkline treatment; quicksort pivot
   chip and `< / = / >` sub-segments; merge progress fill; edge draw-on and return-pulse
   timings; the depth-dimming curve; the tree-layout rule (children centred under parent,
   siblings spaced by subtree width).
8. **Heap tree**: node spacing floor that triggers the honest notice instead of overlap,
   the sift-down path highlight, the extracted/final strip, index labels.
9. **Pass ladder**: row anatomy, the three row states, the "you are here" marker, and the
   exact honest-degradation copy for bubble, insertion and selection.
10. **Responsive**: desktop 1440 / tablet 768 / mobile 375 / cinema mode for both views,
    including what is dropped first and in what order.
11. **Reduced motion and AA contrast table** covering every new pairing.
12. **A "what breaks and how it degrades" table**: n=200, n=5, n=1, empty array, an
    algorithm with no recursion tree, a degenerate quicksort tree.

**Acceptance criteria**

- Every new colour is a token alias with resolved hex and a stated contrast ratio; no raw
  hex is proposed for component code.
- A frontend developer can implement WF2–WF5 with zero further design questions.
- Every animation is expressed in existing `--duration-*` / `--ease-*` / `--step-ms`
  terms and has both a reduced-motion and a `SNAP_SPEED` fallback.
- The spec names, in one short list, what was deliberately left out to honour "simple".
- The spec addresses each confirmed defect from WT0 that has a visual/layout cause
  (B2, B3, B4, B5, B8, B9, B13).

---

## frontend-developer (continued)

### WF2. Array view rebuild — groups, cursors, invariant, single row — `done`

**Depends on:** WD1, WF1.
**Touches:** `src/components/ArrayView.tsx` (rebuild), `src/styles/views.css`,
`src/styles/tokens.css` (aliases from WD1), `src/pages/Visualizer.tsx` (new props only).

Implement `docs/PLAN.md` §WS4 items 1–6 and 10: phase strip, invariant line, group
brackets, cursor rail, the single-row track physically divided into groups with per-group
backing panels and inter-group gaps, the index track, and overflow/auto-follow/minimap.
Callout, merge runs and swap arcs come in WF3.

Thread new props from `Visualizer.tsx`: `algorithmKey`, `steps`, `onShrink` (reuse the
existing Crane callback), `onSeek` (expose `Player.seekTo` through `usePlayback` if not
already exposed — do not add a second seek path).

**Acceptance criteria**

- For each of the six algorithms, paused mid-run, the row is visibly divided into that
  algorithm's groups with correct labels: quicksort shows `< pivot` / `>= pivot` /
  unexamined / pivot; insertion shows the ordered prefix distinct from the unsorted tail
  **and visually distinct from "final"**; selection shows searched vs still-to-search;
  bubble shows swept vs not-reached vs bubbled-into-place; merge shows merged vs
  destination; heap shows the live heap vs extracted.
- Group panels resize as bounds change; they do not fade out and back in each step.
- Every cursor named in §WS3.2 is on the rail, labelled, over the correct column.
- The invariant line is present and correct for all six algorithms and updates each step.
- Single row at every n — no wrapping. At n=200 the track scrolls, auto-follow keeps the
  cursors visible, sub-22 px cells hide values and show the shrink notice.
- Cells keep identity by bar id and still slide on swaps; `speed >= SNAP_SPEED` snaps
  everything; `prefers-reduced-motion` disables movement but not state colour updates.
- **Report which algorithms you stepped through in the browser, at which n, and what you
  observed** — screenshots or precise descriptions, not "it works".

### WF3. Array view — comparison callout, swap arcs, merge source runs — `done`

**Depends on:** WF2.
**Touches:** `src/components/ArrayView.tsx`, `src/styles/views.css`.

Implement `docs/PLAN.md` §WS4 items 7, 8 and 9.

**Acceptance criteria**

- The callout shows both values from `ctx.values`, the correct operator and the verdict
  from `compareOutcome()`. Confirm by hand on quicksort and insertion that a `keep` verdict
  never precedes a swap of the same indices, and vice versa.
- **Merge sort specifically:** step through a merge of `[5, 3, 8, 1]` and check every
  callout against a hand trace. The values shown must be the ones being merged, not the
  already-overwritten cells. This correctness bug is a primary reason the feature exists.
- The merge source-run strips appear only while `ctx.merge` is present and grey out
  consumed elements as `takeLeft`/`takeRight` advance.
- The swap arc renders on every swap, never persists past its step, and is absent at
  `SNAP_SPEED` and under reduced motion.
- Smooth at n=200, speed 5 — report frame timing.

### WF4. Tree view rebuild — recursion tree, heap tree, ribbon, call rail — `done`

**Depends on:** WD1, WF1, WT0. May run in parallel with WF2/WF3; land it after WF2 to keep
the diff reviewable.
**Touches:** `src/components/TreeView.tsx` (becomes a thin shell), new
`src/components/tree/RecursionTree.tsx`, `tree/HeapTree.tsx`, new pure
`src/engine/treeProgress.ts` (+ its test), `src/engine/treeModel.ts`,
`src/styles/views.css`.

Rebuild, do not patch. Implement `docs/PLAN.md` §WS5.1 in full, and **use WT0's confirmed
defect list as the acceptance checklist**.

Specific fixes required:

- **B1** — a merge node must show "returned" as soon as its own merge completes, not at the
  end of the run. Prefer deriving completion in `treeProgress.ts` from the combine's write
  count reaching the range size. If you conclude `merge.ts` must emit per-range
  `markSorted` instead, say so explicitly, and add tests proving counters and replay are
  unaffected.
- **B2/B3/B13** — heap layout computed from `n` and depth alone (no container-height
  feedback loop), rendered with a proper `viewBox`, correct at 375 px and in cinema mode
  and on first paint.
- **B4** — a minimum node spacing; below it show the honest notice rather than overlapping.
- **B5** — only `0…end-1` is drawn as the heap; extracted elements move to a final strip.
- **B6** — the quicksort tree is derived from the emitted steps, not a duplicated Lomuto
  partition. `buildQuickSegments` is deleted or demoted to a test helper.
- **B7** — the progress model is `useMemo`'d on `[steps]`; no O(index) rescan per frame.
- **B8/B9** — real tree layout (children centred under parent, siblings spaced by subtree
  width), capped depth, horizontal scroll when needed.
- **B10** — quicksort nodes show the pivot value and, once partitioned, the three
  sub-segments.
- **B11** — remove `deepestContaining` or put it to use.

Plus the shared shell: pinned array ribbon with the active-range bracket, call-stack rail
with depth numbers, depth guides, four honest node states with value sparklines, draw-on
edges with return pulses, depth dimming and the active-node glow; and the heap upgrades
(sift-down path, final strip, per-node index labels, parent-vs-child callout).

**Acceptance criteria**

- Every confirmed WT0 defect is demonstrably fixed; refuted ones are noted.
- The ribbon shows the live array and brackets the active node's range.
- A node never appears before its `divide` step has executed, and stepping **backwards**
  un-draws the tree correctly (this behaviour must survive the rebuild).
- Merge: leaves visibly become ordered runs and fuse; a combining node shows real progress;
  a finished node turns "returned" immediately, not at the end of the run.
- Quick: every node shows its pivot; after partition the three sub-segments have correct
  proportions; a reversed input at n=32 renders legibly rather than as a 5000 px column.
- Heap: sift-down path highlighted, extracted region shown as final, index labels aligned
  with the ribbon, no overlap at any n, correct at 375 px and in cinema mode.
- **Report which algorithms you stepped through, at which n and which viewports.**

### WF5. Structure fallback for bubble, insertion and selection — `done`

**Depends on:** WF1, WF4.
**Touches:** new `src/components/tree/PassLadder.tsx`, `src/components/TreeView.tsx`,
`src/components/viewMode.ts` (retire `TREE_CAPABLE`), `src/components/ViewModeSwitch.tsx`
(label -> "Structure"), `src/pages/Visualizer.tsx` (drop the forced fallback to `columns`).

Implement `docs/PLAN.md` §WS6.

**Acceptance criteria**

- The Structure tab is available for all six algorithms and never shows an empty panel.
- Bubble and selection show a visibly shrinking active window per pass; insertion shows a
  growing ordered prefix.
- Each ladder states plainly that the algorithm has no recursion tree, in WD1's copy — no
  fake tree, no apologetic empty state.
- Clicking a row seeks playback to that pass's first step and the Array view agrees.
- Switching algorithms while on the Structure tab no longer kicks the user back to Columns
  (fixes B12).
- `buildPassLadder` is memoized on `[steps]`; confirm with the React profiler that it does
  not re-run per frame at n=200.

### WF6. Polish, perf and a11y pass across both views — `partial`

> Done: reduced-motion fallbacks for the swap arc, write pulse, group panels and
> cursor rail; snap-speed disables all motion; `role="img"` + `aria-label` on both
> SVGs; `aria-live` status text retained. **Not done:** keyboard navigation of the
> tree, focus management when switching views, and a screen-reader pass over the
> new group brackets and invariant line.

**Depends on:** WF3, WF5.

- Verify line by line against `docs/DESIGN.md` §12 and fix every drift.
- Confirm zero raw hex in the new components; everything through tokens.
- Confirm `aria-live` status intact; the invariant line, group labels and callout are real
  DOM text; pass-ladder rows are focusable buttons with the standard focus ring.
- Check reduced-motion and `SNAP_SPEED` paths for every new animation.
- Check 375 px, 768 px, 1440 px and cinema mode for both views.
- Measure and report: frame time at n=200 speed 5 in both views, and the first-render cost
  of the Structure tab on bubble at n=200.

**Acceptance criteria**

- No layout shift while stepping; no console warnings or errors in any view at any n.
- All four gates green; `git diff --stat src/components/three` is empty.

---

## code-reviewer

### WR1. Adversarial review of the Groups & Structure diff — `todo`

**Depends on:** WF6.
**Skills:** `engineering:code-review`, `security-review`.

Review the full feature diff against `docs/PLAN.md` §WS3–§WS9. Focus on:

1. **Do the groups tell the truth?** Hand-trace quicksort and merge. A plausible-but-wrong
   group is worse than no group — it teaches a student something false.
2. **The comparison verdict** — can `compareOutcome` disagree with what the array does
   next? Check the lookahead across interleaved `markSorted` / `divide` / `combine` steps.
3. **The invariant sentences** — pick five at random and verify each is literally true of
   the array at that step.
4. **Off-by-one and degenerate inputs** — n=0, n=1, all-equal, duplicates, already sorted;
   scrubbing to index 0 and to `total`.
5. **Backwards scrubbing** — do groups, cursors, tree and ladder all un-draw correctly?
6. **B1–B13** — confirm each is fixed or explicitly refuted, not silently dropped.
7. **Performance** — any O(steps) work in a render path or a non-memoized hook.
8. **Token discipline** — raw hex, a new palette, or an inline style that should be a token.
9. **Contract creep** — `Frame`, `Counters`, `applyStepsToArray` and the pre-existing test
   files untouched; `ctx` genuinely optional everywhere.
10. **Removal completeness** — no shell/radix residue anywhere, including docs and deep
    links.
11. **Frozen files** — `src/components/three/**` has zero diff.

**Acceptance criteria**

- Every finding filed as a new numbered task in this file with a severity, or explicitly
  waived with a stated reason.
- At least one hand-traced example per algorithm family (comparison-swap, divide-and-
  conquer, heap) recorded in the review.

---

## qa-tester

### WQ1. Real-browser sign-off for both views — `partial`

> Covered: all 6 algorithms × 3 views mount and step without error; all 6 run to
> completion with a correctly sorted result; n=200 across quick/merge/heap/bubble
> with no page overflow; quicksort worst case (reversed, n=200) caps at depth 12
> with "181 deeper calls hidden"; heap at n=200 has 36px spacing against 15px
> radius (no overlap); swap arcs and write pulses fire. **Not covered:** light
> theme, mobile/tablet breakpoints, cinema mode, scrubbing backward through the
> new views, and sound. Also note the preview pane was hidden throughout, which
> throttles rAF — timing-sensitive checks were unreliable and one apparent
> failure turned out to be a DOM-read race, not a defect.

**Depends on:** WR1 and any fixes it generates.
**Skills:** `project-qa-check`, `engineering:testing-strategy`, `security-review`.

For **each of the six algorithms**, in **both** the Array and the Structure view:

- n = 5, 16, 64, 200; speeds 1 and 5; play, pause, step forward, step back, reset.
- A hand-typed custom array, including duplicates and an already-sorted input.
- The empty state (no array yet) — both views must show it and must never invent data.
- Scrub to the middle, step back 20 steps, and confirm groups, cursors, callout, tree and
  ladder all agree with the array on screen.
- Keyboard only: space / arrows / R, plus tabbing to the pass-ladder rows.
- Reduced motion on (OS setting), 375 px viewport, and cinema mode.

Verify the pedagogy, not just the pixels:

- Pick three random paused steps per algorithm; check the invariant line is a **true**
  statement about the array shown.
- Pick three random paused steps per algorithm; check every group label is true of the
  cells it spans (especially quicksort's `< pivot` / `>= pivot`).
- Check the comparison callout's values against the cells — and for merge, against a hand
  trace. This is the known trap.
- Confirm the tree never shows a call that has not happened.

Also: confirm `src/components/three/**` is unchanged; confirm no shell/radix residue in
UI, README or docs and that `?algo=shell` degrades gracefully; update `docs/STRUCTURE.md`
with the new files; confirm the README describes the six algorithms and the two rebuilt
views accurately; run the four gates.

**Acceptance criteria**

- A pass/fail table: 6 algorithms x 2 views x 4 sizes, with every failure written up as a
  new task in this file.
- Explicit statements of what you observed for the merge callout check, the group-label
  spot-checks and the invariant spot-checks.
- No console errors or warnings anywhere. All four gates green; report the final test
  count.
- A sign-off line stating the feature meets `docs/PLAN.md` §WS9, or naming exactly which
  criteria it misses.
