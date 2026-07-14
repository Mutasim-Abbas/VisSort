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
