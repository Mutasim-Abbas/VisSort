# Project structure

```
VisSort/
├─ index.html               # Entry HTML; inline pre-paint theme bootstrap (no FOUC)
├─ package.json             # Scripts + dependencies
├─ vite.config.ts           # Vite + Vitest config
├─ tsconfig.json            # TypeScript (strict) config
├─ tailwind.config.ts       # Tailwind theme mapped 1:1 to CSS-variable tokens
├─ postcss.config.js
├─ eslint.config.js
├─ .prettierrc.json / .prettierignore
├─ .gitignore
├─ README.md
│
├─ docs/                    # Team source-of-truth documents
│  ├─ PLAN.md               # Goal, scope, tech stack, phases
│  ├─ TODO.md               # Task list with statuses & acceptance criteria
│  ├─ DESIGN.md             # Design system: tokens, layout, motion, components
│  └─ STRUCTURE.md          # This file
│
└─ src/
   ├─ main.tsx              # React entry; font + stylesheet imports
   ├─ App.tsx               # App shell, state, layout, keyboard shortcuts
   │
   ├─ engine/               # Pure sorting logic — no DOM, no React
   │  ├─ types.ts           # Step union + shared types
   │  ├─ counters.ts        # Statistics derived from steps
   │  ├─ replay.ts          # Apply steps to an array (used by tests)
   │  ├─ player.ts          # Visual-state engine driven by the step list
   │  ├─ registry.ts        # Algorithm metadata (name, Big-O, stability, …)
   │  ├─ stepContext.ts     # Derivations over Step.ctx: groups, invariants,
   │  │                     #   compare outcomes, the pass ladder
   │  ├─ treeProgress.ts    # Recursion-tree model derived from emitted steps
   │  ├─ algorithms/        # One pure step generator per algorithm
   │  │  ├─ shared.ts        bubble.ts     insertion.ts  selection.ts
   │  │  ├─ merge.ts         quick.ts      heap.ts
   │  ├─ algorithms.test.ts # Correctness matrix (replay-based)
   │  ├─ stepContext.test.ts   # Group cover + group-truth invariants
   │  ├─ treeProgress.test.ts  # Tree structure, node lifecycle, layout
   │  └─ player.test.ts     # Playback-path, scrub, counter, reset tests
   │
   ├─ data/
   │  └─ presets.ts         # Array generation (random / nearly-sorted / …)
   │
   ├─ hooks/
   │  ├─ usePlayback.ts     # requestAnimationFrame playback driver
   │  ├─ useTheme.ts        # Theme state + persistence
   │  └─ useElementSize.ts  # ResizeObserver hook for canvas layout
   │
   ├─ components/
   │  ├─ Header.tsx  ThemeToggle.tsx  Controls.tsx  Transport.tsx
   │  ├─ BarCanvas.tsx  StatsPanel.tsx  InfoPanel.tsx  Legend.tsx
   │  ├─ ArrayView.tsx      # The row, divided into the algorithm's own groups
   │  ├─ TreeView.tsx       # Structure-view shell; picks one of the three below
   │  ├─ ViewModeSwitch.tsx  viewMode.ts
   │  ├─ tree/
   │  │  ├─ ArrayRibbon.tsx    # Pinned array strip — the tree↔array link
   │  │  ├─ RecursionTree.tsx  # merge / quick
   │  │  ├─ HeapTree.tsx       # heapsort
   │  │  └─ PassLadder.tsx     # bubble / insertion / selection
   │  ├─ three/             # The 3D crane stage (Columns view)
   │  └─ icons.tsx
   │
   ├─ styles/
   │  ├─ tokens.css         # Design tokens (colors, motion, spacing) — dark + light
   │  └─ index.css          # Tailwind layers + bar/slider/glass component CSS
   │
   └─ test/
      └─ setup.ts           # Vitest + jest-dom setup
```

## Conventions

- **Engine is pure.** Nothing in `src/engine/` imports React or touches the DOM,
  which keeps algorithms unit-testable and deterministic.
- **Tokens only.** Components never hardcode colors — they use the CSS variables
  from `styles/tokens.css` (via Tailwind utilities or `var(--…)`).
- **Steps are the source of truth.** Heights, highlights, and every counter are
  derived from the step index, so scrubbing backward is always exact.
