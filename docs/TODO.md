# VisSort — Phase 1 Task Board

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
