# VisSort — Design Specification

> Owner: ui-ux-designer. Consolidates deliverables **D1–D6** (design direction, tokens, layout, bar-state color+motion, components, race/sound UX) into one buildable spec.
> Status: complete — frontend-developer should be able to implement F5–F9 (and F11/F12) from this document without follow-up questions.
>
> **⚠️ Historical.** This captures the original design system. The shipped app
> later adopted a **cinematic liquid-glass** direction (Instrument Serif display
> type, glass chrome, amber + lime accents) and is **dark-theme only** — the
> light-theme tokens below are no longer used. The bar-state colors and overall
> approach still hold. See [`../README.md`](../README.md) for what shipped.
> All contrast ratios below were computed with the WCAG 2.x relative-luminance formula against the exact hex values shown.
> Last updated: 2026-07-13.

---

## 1. Design direction (D1)

### 1.1 The chosen direction: "Precision Instrument"

VisSort looks and feels like a **calm, premium developer instrument** — closer to an oscilloscope or a well-made audio tool than to a colorful classroom poster. Dark-mode-first, quiet chrome, one confident accent, and a visualization canvas that is unmistakably the hero. The interface recedes; the algorithm performs.

**Why this direction (and not "bright educational"):**

- The audience (CS students, interview preppers, educators, developers) lives in dark IDEs, terminals, and docs. A dark-first instrument aesthetic signals "serious tool," which is exactly the credibility PLAN.md's quality bar asks for ("not a toy demo").
- The visualization itself is the color. Six saturated bar-state colors read far better against a near-black canvas — glows and state changes get free contrast. A busy, colorful UI chrome would compete with the data.
- Educators project this in classrooms — so the **light theme is a first-class deliverable** (bright rooms, projectors), not an inversion. Both themes are fully specified below with equal care.
- 2026 language, applied with restraint: calm purposeful motion, one glass layer (the floating control bar), layered dark surfaces for elevation, mono-inspired type for data, a single cheap "aurora" flourish in the header. **No WebGL anywhere** — the bar canvas must hold 60fps at 200 DOM bars; a 3D engine is the wrong tool and is explicitly out of scope.

### 1.2 Moodboard notes (text references)

1. **Linear.app's surface discipline** — near-black blue-tinted backgrounds, elevation done with subtle lightness steps and 1px borders instead of heavy shadows, one electric accent. This is the base recipe for our chrome.
2. **Teenage Engineering hardware** — a calm neutral body with a few high-signal functional colors (each color *means* something). Our six bar-state colors follow this: color is semantic, never decorative.
3. **Vercel/Geist dashboards** — monospaced numerals for anything quantitative, generous whitespace, quiet borders. This drives the stats strip and Big-O table.

### 1.3 Feel keywords

Calm · precise · luminous data on quiet surfaces · fast · trustworthy.

---

## 2. Design tokens (D2)

Implement exactly these names as CSS custom properties on `:root[data-theme="dark"]` and `:root[data-theme="light"]`, mapped into Tailwind via `theme.extend.colors` etc. **Components must never use raw hex — tokens only** (F8 acceptance).

Theme bootstrapping: inline `<script>` in `index.html` `<head>` reads `localStorage.vissort-theme`, falls back to `prefers-color-scheme`, and sets `data-theme` on `<html>` before first paint (no FOUC). Also set `color-scheme: dark` / `light` per theme so native controls/scrollbars match.

### 2.1 Color tokens — dark theme (default)

```css
:root[data-theme="dark"] {
  color-scheme: dark;

  /* Background layers (3+ depths, back → front) */
  --bg-base:        #0B0E14;  /* app background */
  --bg-canvas:      #0B0E14;  /* bar canvas backdrop (same as base; canvas is framed by border) */
  --bg-surface-1:   #11151F;  /* page-level panels (stats strip, info panel) */
  --bg-surface-2:   #171D2B;  /* cards, inputs, control bar base */
  --bg-surface-3:   #1E2536;  /* popovers, open select menu, tooltips */

  /* Text */
  --text-primary:   #E9EDF5;
  --text-secondary: #A9B3C9;
  --text-muted:     #8893AD;  /* captions, hints — still AA on every surface */

  /* Accent (indigo — deliberately distinct from all 6 bar-state hues) */
  --accent:         #7C8CFF;
  --accent-hover:   #93A0FF;
  --accent-active:  #6575F0;
  --on-accent:      #0B0E14;  /* text/icons on accent fills */
  --accent-soft:    rgb(124 140 255 / 0.14);  /* tints, selected-option bg */

  /* Borders & focus */
  --border-subtle:  #222A3D;
  --border-strong:  #35405C;
  --focus-ring:     #93A0FF;
}
```

### 2.2 Color tokens — light theme

```css
:root[data-theme="light"] {
  color-scheme: light;

  --bg-base:        #EEF1F6;
  --bg-canvas:      #F7F9FC;
  --bg-surface-1:   #F7F9FC;
  --bg-surface-2:   #FFFFFF;
  --bg-surface-3:   #FFFFFF;  /* differentiated by --shadow-3, not color */

  --text-primary:   #161C29;
  --text-secondary: #414D66;
  --text-muted:     #5C6A87;

  --accent:         #4F46E5;
  --accent-hover:   #4338CA;
  --accent-active:  #3730A3;
  --on-accent:      #FFFFFF;
  --accent-soft:    rgb(79 70 229 / 0.10);

  --border-subtle:  #DCE2EC;
  --border-strong:  #B9C2D4;
  --focus-ring:     #4F46E5;
}
```

### 2.3 Verified contrast ratios (WCAG AA)

AA requires 4.5:1 body text, 3:1 large text (≥18.66px or ≥14px bold) and non-text UI graphics.

| Pair (dark) | Ratio | | Pair (light) | Ratio |
|---|---|---|---|---|
| text-primary on bg-base | **16.46:1** | | text-primary on surface-2 (white) | **17.04:1** |
| text-primary on surface-2 | **14.35:1** | | text-primary on bg-base | **15.05:1** |
| text-secondary on bg-base | **9.18:1** | | text-secondary on white | **8.47:1** |
| text-secondary on surface-3 | **7.27:1** | | text-secondary on bg-base | **7.48:1** |
| text-muted on bg-base | **6.28:1** | | text-muted on white | **5.43:1** |
| text-muted on surface-3 (worst case) | **4.97:1** | | text-muted on bg-base | **4.80:1** |
| accent as link text on bg-base | **6.49:1** | | accent as link text on white | **6.29:1** |
| on-accent text on accent (buttons) | **6.49:1** | | on-accent text on accent | **6.29:1** |
| focus-ring vs bg-base / surface-3 | **8.01 / 6.35:1** | | focus-ring vs bg-base | **5.55:1** |

Every text/background combination above passes AA body text (≥4.5:1). Disabled-state text (see §7) is exempt from contrast requirements per WCAG.

### 2.4 Bar-state color tokens (summary — full spec in §5)

```css
/* dark theme */                       /* light theme */
--color-bar-default:     #5A6B94;      --color-bar-default:     #64748B;
--color-bar-comparing:   #FFC53D;      --color-bar-comparing:   #D97706;
--color-bar-swapping:    #FF6B4A;      --color-bar-swapping:    #D6452A;
--color-bar-pivot:       #C77DFF;      --color-bar-pivot:       #9333EA;
--color-bar-overwriting: #45C4FF;      --color-bar-overwriting: #0284C7;
--color-bar-sorted:      #1FCE9C;      --color-bar-sorted:      #0D9488;
```

### 2.5 Motion tokens

```css
:root {
  --duration-fast:  120ms;  /* hovers, color ticks, small state changes */
  --duration-base:  200ms;  /* most UI transitions: toggles, chips, fades */
  --duration-slow:  320ms;  /* panel expand/collapse, theme cross-fade */
  --duration-scene: 550ms;  /* celebration sweep base (see §5.5) */

  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* entrances */
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);        /* exits */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* position moves (bar swaps) */
  --ease-pop:    cubic-bezier(0.34, 1.56, 0.64, 1); /* celebration ONLY — never on regular UI */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast:  80ms;   /* color/opacity feedback stays perceivable */
    --duration-base:  0ms;
    --duration-slow:  0ms;
    --duration-scene: 0ms;
  }
}
```

Reduced-motion rule of thumb: **color and opacity changes survive (≤80ms); anything that moves, scales, or staggers does not.** Per-case fallbacks are stated where they matter (§5.5, §8, §9).

### 2.6 Spacing, radii, elevation

```css
:root {
  /* Spacing — 4px base scale. Use these only; no arbitrary values. */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Radii */
  --radius-sm:   6px;   /* chips, kbd hints, inputs */
  --radius-md:   10px;  /* buttons, select */
  --radius-lg:   14px;  /* cards, panels */
  --radius-xl:   20px;  /* canvas frame, mobile sheet */
  --radius-full: 999px; /* pills, slider track/thumb, play button */
}

:root[data-theme="dark"] {
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.40);
  --shadow-2: 0 4px 12px rgb(0 0 0 / 0.35);
  --shadow-3: 0 12px 32px rgb(0 0 0 / 0.45);
}
:root[data-theme="light"] {
  --shadow-1: 0 1px 2px rgb(22 28 41 / 0.06);
  --shadow-2: 0 4px 12px rgb(22 28 41 / 0.08);
  --shadow-3: 0 12px 32px rgb(22 28 41 / 0.12);
}
```

**Elevation model (dark-first):** depth = surface lightness step (+ 1px `--border-subtle`) first, shadow second. Dark shadows are barely visible — they support, never carry, the hierarchy. Light theme leans more on shadows since surfaces converge on white.

| Level | Use | Recipe |
|---|---|---|
| 0 | app bg | `--bg-base` |
| 1 | panels | `--bg-surface-1` + `--border-subtle` + `--shadow-1` |
| 2 | cards, inputs, control bar | `--bg-surface-2` + `--border-subtle` + `--shadow-1` |
| 3 | menus, tooltips, sheets | `--bg-surface-3` + `--border-subtle` + `--shadow-3` |

### 2.7 The one glass layer

Exactly **one** glassmorphic element exists: the floating control bar (§6.3, §7). Recipe:

```css
.control-bar {
  background: color-mix(in srgb, var(--bg-surface-2) 72%, transparent);
  backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  /* gradient light-catch border via background-clip trick or ::before overlay: */
  /* linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02)) — dark */
  /* linear-gradient(180deg, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.4))  — light */
}
```

Do not add more glass layers — this is a data-dense tool; clarity beats atmosphere.

---

## 3. Typography

Three faces, each with one job. **Self-host all fonts via `@fontsource` npm packages (woff2)** — no Google Fonts CDN `<link>`. Rationale: Q4 requires zero runtime network calls / full offline function; CDN fonts violate that. Preload the two variable font files in `index.html`.

| Role | Font (Google Fonts, self-hosted) | Package | Weights |
|---|---|---|---|
| Display — wordmark, section headings, celebration toast | **Bricolage Grotesque** (variable) | `@fontsource-variable/bricolage-grotesque` | 600–800 |
| Body/UI — everything else | **Inter** (variable) | `@fontsource-variable/inter` | 400–600 |
| Data — stat values, Big-O, sliders' readouts, kbd hints | **JetBrains Mono** | `@fontsource/jetbrains-mono` | 400, 500, 700 |

```css
--font-display: 'Bricolage Grotesque Variable', 'Inter Variable', system-ui, sans-serif;
--font-body:    'Inter Variable', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
```

### Type scale (rem values assume 16px root)

| Token | Size / line-height | Face & weight | Used for |
|---|---|---|---|
| `--text-xs` | 11px / 16px | Mono 400, +0.02em tracking | kbd hints, axis/caption text |
| `--text-sm` | 12px / 16px | Inter 500, uppercase +0.08em | stat card labels, table headers |
| `--text-base` | 14px / 22px | Inter 400 | body copy, descriptions, controls |
| `--text-md` | 16px / 24px | Inter 500 | control labels, select value |
| `--text-lg` | 18px / 26px | Bricolage 600 | panel headings ("Quick Sort") |
| `--text-xl` | 22px / 28px | Bricolage 700 | wordmark "VisSort" |
| `--text-stat` | 24px / 30px | Mono 500 | stat card values |
| `--text-hero` | clamp(24px, 3vw, 32px) / 1.2 | Bricolage 700 | race-mode winner toast, empty state |

Rules:
- All numerals that update live (stats, step counter, slider readouts) use `--font-mono` — fixed-width digits guarantee **zero layout shift at 200 steps/s** (F7 acceptance).
- Body text never uses Bricolage; Bricolage never appears below 16px.
- Wordmark treatment: "VisSort" in Bricolage 700 with gradient text `linear-gradient(90deg, var(--accent), var(--color-bar-overwriting))`, `background-clip: text`. Both gradient endpoints exceed 3:1 large-text contrast in both themes (dark 6.49/9.74:1, light 6.29/3.88:1).

---

## 4. Layout & responsive spec (D3)

Structural regions: **Header** (wordmark, algorithm selector, sound toggle*, theme toggle) · **Canvas** (hero) · **Control bar** (transport, sliders, generate/presets) · **Stats** (4 counters) · **Info panel** (description + Big-O). (*sound = stretch S3.)

### 4.1 Desktop ≥1280px — canvas + right sidebar, everything visible, zero scroll while running

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER h:64  [◤VisSort]      [Algorithm: Quick Sort ▾]          [🔊] [◐]     │ ← surface-1, border-b
├──────────────────────────────────────────────┬───────────────────────────────┤
│                                              │  SIDEBAR w:340, p:24 gap:16   │
│   BAR CANVAS  (bg-canvas, radius-xl frame,   │ ┌───────────┐ ┌───────────┐   │
│   border-subtle, flex-1 → ≥60vh)             │ │COMPARISONS│ │ SWAPS     │   │
│                                              │ │   1,284   │ │   402     │   │
│      ▂▄▆█▃▅▇▁▂▆▄█▅▃▇▆▂▄ …                    │ └───────────┘ └───────────┘   │
│      (bars bottom-anchored, gap 1-2px)       │ ┌───────────┐ ┌───────────┐   │
│                                              │ │ ACCESSES  │ │STEP       │   │
│   [aria-live status: "Sorting… 1,284         │ │   2,010   │ │1,532/3,940│   │
│    comparisons" — visually-hidden]           │ └───────────┘ └───────────┘   │
│                                              │ ┌───────────────────────────┐ │
├──────────────────────────────────────────────┤ │ ⓘ Quick Sort              │ │
│ CONTROL BAR h:76 (glass, floats 16px above   │ │ Partition-based… (2-4     │ │
│ bottom of canvas column, radius-lg)          │ │ sentences)                │ │
│ [↺][⏮][ ▶ 48px ][⏭]  Speed ───●── 40/s      │ │ ┌───────────────────────┐ │ │
│ Size ──●──── 100   [Shuffle]                 │ │ │Best    O(n log n)     │ │ │
│ [Random][Nearly][Reversed][Few-unique]       │ │ │Average O(n log n)     │ │ │
│                                              │ │ │Worst   O(n²)          │ │ │
│ kbd hint: Space ▶ · ←→ step · R reset        │ │ │Space   O(log n)       │ │ │
│                                              │ │ └───────────────────────┘ │ │
│                                              │ │  ⚠ Not stable             │ │
│                                              │ └───────────────────────────┘ │
└──────────────────────────────────────────────┴───────────────────────────────┘
```

- Grid: `grid-template-columns: 1fr 340px`, gap `--space-4`, page padding `--space-5`.
- Canvas column height = `100vh − header`; canvas gets `flex: 1` → ≥60vh on any laptop. **No control requires scrolling while an animation runs.**
- Stat cards: 2×2 grid in sidebar. Info panel fills remaining sidebar height; its description scrolls internally if needed (panel never pushes page).

### 4.2 Tablet ~768px — single column, canvas still hero

```
┌────────────────────────────────────────────┐
│ HEADER h:60 [◤VisSort] [Quick Sort ▾] [◐]  │
├────────────────────────────────────────────┤
│  BAR CANVAS  h: 48vh (min 320px)           │
│      ▂▄▆█▃▅▇▁▂▆▄█▅▃▇▆▂▄ …                  │
├────────────────────────────────────────────┤
│ CONTROL BAR (glass, 2 rows, p:16)          │
│ [↺][⏮][ ▶ ][⏭]   Speed ───●──  40/s       │
│ Size ──●── 100  [Shuffle] [Random][Nearly] │
│                 [Reversed][Few-unique]     │
├────────────────────────────────────────────┤
│ STATS row: 4 cards in one row (min-w 150)  │
│ [COMPAR. 1,284][SWAPS 402][ACC. 2,010][…]  │
├────────────────────────────────────────────┤
│ ⓘ Quick Sort            (accordion, OPEN   │
│   description + Big-O    by default)       │
└────────────────────────────────────────────┘
```

- Stats wrap 2×2 below 700px available width. Info panel becomes an accordion (open by default; header row toggles, chevron rotates 200ms).
- Canvas + control bar together fit one viewport; stats/info scroll below — acceptable on tablet (desktop is the "teaching" viewport).

### 4.3 Mobile ~375px — fixed bottom transport, nothing dropped

```
┌──────────────────────────────┐
│ HEADER h:56 [◤VisSort]  [◐]  │
│ [ Algorithm: Quick Sort  ▾ ] │ ← full-width select, h:44
├──────────────────────────────┤
│  BAR CANVAS h: 42vh          │
│  (min 260px)                 │
│   ▂▄▆█▃▅▇▁▂▆▄█▅▃▇▆ …         │
├──────────────────────────────┤
│ Speed ────●────  40 steps/s  │  sliders full-width,
│ Size  ──●──────  60 elems    │  h:44 touch rows
│ [Shuffle▸][Random][Nearly][R…│ ← chip row, horiz. scroll
├──────────────────────────────┤
│ STATS 2×2 compact grid       │
│ [COMPARISONS ][ SWAPS      ] │
│ [ACCESSES    ][ STEP       ] │
├──────────────────────────────┤
│ ⓘ Quick Sort            ▾   │ ← accordion, CLOSED by default
│   (expands in-page)          │
├──────────────────────────────┤
│ ▓ FIXED BOTTOM BAR (glass)   │
│  [↺ 44] [⏮ 44] (▶ 56) [⏭ 44]│ ← safe-area-inset-bottom
└──────────────────────────────┘
```

Mobile adaptation rules (nothing is dropped):
- Algorithm selector moves out of the header into a full-width 44px select beneath it.
- Transport (reset/step-back/play/step-forward) moves to a **fixed bottom glass bar** for thumb reach; play button 56px, others 44px; respects `env(safe-area-inset-bottom)`.
- Presets + Shuffle become a horizontally scrollable chip row (each chip ≥44px tall including hit area).
- Info panel: accordion, collapsed by default; expands in-page (no modal).
- **All touch targets ≥44×44px** (slider thumbs render 20px but carry a 44px hit area via padding). No horizontal page scroll at ≥320px.

Breakpoints: `sm` <640 (mobile layout) · `md` 640–1023 (tablet layout) · `lg` ≥1024 (desktop layout; sidebar 300px at 1024–1279, 340px ≥1280).

---

## 5. Bar-state color & motion spec (D4)

### 5.1 State colors — exact hex per theme, with contrast vs canvas

WCAG 1.4.11 (non-text contrast, ≥3:1 vs adjacent background) verified for every bar color:

| State | Dark hex | vs `#0B0E14` | Light hex | vs `#F7F9FC` | Secondary (non-hue) cue |
|---|---|---|---|---|---|
| default | `#5A6B94` | 3.65:1 | `#64748B` | 4.51:1 | lowest luminance/saturation; flat fill, no glow |
| comparing | `#FFC53D` | 12.24:1 | `#D97706` | 3.02:1 | **brightest state** + soft glow |
| swapping | `#FF6B4A` | 6.86:1 | `#D6452A` | 4.20:1 | strong glow + scaleY pulse (motion) |
| pivot | `#C77DFF` | 7.18:1 | `#9333EA` | 5.10:1 | **persistent chevron marker (▲) under the bar** |
| overwriting | `#45C4FF` | 9.74:1 | `#0284C7` | 3.88:1 | **2px white/near-white top cap** + flash-in; transient |
| sorted | `#1FCE9C` | 9.54:1 | `#0D9488` | 3.55:1 | vertical gradient fill + top highlight; persistent, calm, never glows |

### 5.2 Color-blind safety (explicit, per D4 acceptance)

Hue alone is never the only differentiator — every state also differs in **luminance step and/or a shape/motion cue**:

- **Deuteranopia/protanopia (red-green, ~8% of men):** the warm cluster (comparing amber / swapping vermillion) collapses toward yellow-brown — they remain separated by a large luminance gap (dark: 12.24 vs 6.86 vs canvas) plus swapping's glow+pulse. Sorted is deliberately **teal-leaning green** so it shifts toward blue for red-green CVD, away from the warm cluster.
- **States that co-occur on screen** get shape cues: pivot (persists through a quicksort pass) carries a chevron marker; overwriting (merge sort's writes) carries a white top cap and is transient by nature, vs. sorted which is persistent and static.
- Grayscale check: the six dark values land at distinct luminance tiers (3.65 / 12.24 / 6.86 / 7.18 / 9.74 / 9.54 vs canvas) and every ambiguous near-tie (overwriting≈sorted, pivot≈swapping) is disambiguated by marker/cap/glow/motion as above.

### 5.3 Bar anatomy & rendering rules (perf-critical)

- Bars are absolutely-positioned `div`s inside a `position:relative` canvas, **bottom-anchored**, moved only with `transform: translateX(...)`. Never animate `left/top/width` (layout thrash — F5 acceptance).
- Gap between bars: 2px at n≤60, 1px at n≤120, 0px at n>120. Minimum bar width 2px; minimum height 4px (values normalized so nothing collapses to invisible).
- `border-radius: 2px 2px 0 0` at n≤120; none above (subpixel noise).
- Fill: `default` is a flat color. `sorted` uses `linear-gradient(180deg, color-mix(in srgb, var(--color-bar-sorted) 100%, white 12%), var(--color-bar-sorted))` — a static gradient background costs nothing.
- **Glow is allowed only on comparing / swapping / pivot bars** — at most ~5 bars at once: `box-shadow: 0 0 12px 2px color-mix(in srgb, <state-color> 55%, transparent)`. **Never** put shadows/filters on default or sorted bars (200 glowing bars would tank fps).
- Pivot chevron: a 6px CSS triangle rendered in a dedicated marker layer below the canvas baseline at the pivot's x-position (one element, translateX to move), color `--color-bar-pivot`.
- Overwrite cap: `border-top: 2px solid` `#FFFFFF` (dark theme) / `#161C29` (light theme) on the overwriting bar.
- Bars are `aria-hidden="true"`; state is conveyed to AT via the polite live region ("Sorting… 1,284 comparisons"), throttled to 1 update/second.

### 5.4 State-transition motion

Let `stepInterval = 1000 / stepsPerSecond` (speed slider value).

| Transition | Property | Duration | Easing |
|---|---|---|---|
| any → comparing/pivot/overwriting (color) | `background-color` | `min(90ms, 0.8 × stepInterval)` | linear |
| swap (position exchange) | `transform: translateX` | `clamp(40ms, 0.8 × stepInterval, 180ms)` | `--ease-in-out` |
| swapping pulse | `transform: scaleY(1.03)` (origin bottom) | same as swap move | `--ease-out` |
| overwrite (height change) | `height` | `min(120ms, 0.8 × stepInterval)` | `--ease-out` |
| any → sorted | `background` fade | 150ms | `--ease-out` |
| **speed ≥ 20 steps/s** (`stepInterval < 50ms`) | ALL of the above | **0ms — add a `.no-transitions` class on the canvas; snap states** | — |

The ≥20 steps/s cutoff is mandatory: transition queues at high speed cause visual backlog and dropped frames. Snapping is correct behavior, not a degradation.

`prefers-reduced-motion`: swap movement and scaleY pulse are disabled (bars snap to new positions); color changes remain (≤80ms) so state remains legible.

### 5.5 Completion celebration ("sorted sweep")

When the driver fires its completion state (F4):

1. **Sweep:** each bar plays `celebrate` once, left→right, `animation-delay = index × (totalSweep / n)` where `totalSweep = clamp(600ms, n × 8ms, 900ms)`:
   ```css
   @keyframes celebrate {
     0%   { filter: brightness(1);    transform: scaleY(1);    }
     40%  { filter: brightness(1.35); transform: scaleY(1.045); }
     100% { filter: brightness(1);    transform: scaleY(1);    }
   }
   /* per-bar: animation: celebrate 240ms var(--ease-pop); transform-origin: bottom; */
   ```
   All bars are already `sorted`-colored by the final `markSorted`; the sweep is brightness+scale only — cheap (filter on one bar at a time as the stagger passes).
2. **Status pill:** fades in (200ms `--ease-out`) top-center of the canvas: `Sorted ✓ · 1,284 comparisons · 402 swaps` — surface-3 pill, radius-full, shadow-2, mono numerals, sorted-color check icon. Dismisses on any control interaction or new run.
3. Play button morphs to a replay icon (↻) over `--duration-base`.

**Reduced-motion fallback:** no sweep, no scale — bars simply cross-fade to sorted color (300ms, opacity/color only) and the status pill appears without slide. Completion remains unmistakable via color + pill.

---

## 6. Depth & 3D guidance (tasteful, CSS-only)

**Hard rule: no WebGL/Three.js anywhere.** The canvas renders up to 200 animated DOM bars at 60fps; every GPU/main-thread budget goes there. Depth is achieved with the cheap layers below, in priority order:

1. **Surface elevation** (§2.6) — the workhorse. Layered grays + 1px borders.
2. **One glass control bar** (§2.7) — reads as "floating cockpit" above the canvas.
3. **Active-bar glows** (§5.3) — the only glow in the app; makes live data feel luminous.
4. **Header aurora** (the one flourish): two pre-blurred radial-gradient blobs behind the header content — accent + `--color-bar-overwriting` at 12% opacity, ~300×300px, `pointer-events:none`, `overflow:hidden` on the header. Animate `transform: translate/scale` only, 18s, `alternate infinite`, `will-change: transform`. Under `prefers-reduced-motion` (or `sm` screens): render static, no animation. Cost: ~0 — two composited layers.
5. **Wordmark gradient text** (§3).

Explicitly banned: parallax, tilt-on-hover cards, blur animations, `box-shadow` transitions on more than one element at a time, animated gradients on large surfaces, any filter on the canvas container while playing.

---

## 7. Component specs (D5)

Global interaction rules:
- **Focus-visible (all components):** `box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--focus-ring)` (two-ring halo works on every surface; ratios §2.3 — AA compliant). Never remove outlines without this replacement. Keyboard-only (`:focus-visible`).
- **Hover transitions:** `--duration-fast` `--ease-out`. **Pressed:** scale(0.97) where noted, `--duration-fast`.
- **Disabled (all):** `opacity: 0.45; cursor: not-allowed;` no hover/active effects; `disabled` attr or `aria-disabled="true"`. (Contrast exempt per WCAG.)

**Disabled-state logic (authoritative):**

| Control | While `running` | While `paused` mid-run | At boundaries |
|---|---|---|---|
| Algorithm select, size slider, Shuffle, preset chips | **disabled** | enabled — activating one resets the run to step 0 with new steps (defined-safe state) | — |
| Speed slider | enabled (live) | enabled | — |
| Step fwd/back | enabled — pressing **auto-pauses, then steps** | enabled | back disabled at step 0; fwd disabled at final step |
| Play/pause | toggles | toggles | at final step becomes Replay (↻): resets to 0 and plays |
| Reset | enabled | enabled | disabled at step 0 before any playback |
| Theme/sound toggles | always enabled | always | — |

### 7.1 Play/Pause button (primary transport)

- 48px circle (56px mobile), `--radius-full`, bg `--accent`, icon `--on-accent` (play ▶ / pause ⏸ / replay ↻; icon swap cross-fades 120ms).
- Hover: bg `--accent-hover` + `--shadow-2` + subtle glow `0 0 16px var(--accent-soft)`. Active: bg `--accent-active`, scale(0.97). Focus: global ring. Disabled: global (never disabled in practice).
- `aria-label` swaps "Play"/"Pause"/"Replay"; `aria-keyshortcuts="Space"`.

### 7.2 Step / Reset buttons (secondary transport)

- 40px (44px mobile) square, `--radius-md`, ghost style: transparent bg, icon `--text-secondary`, border `--border-subtle`.
- Hover: bg `--bg-surface-3`, icon `--text-primary`, border `--border-strong`. Active: scale(0.97), bg `--accent-soft`. Focus: ring. Disabled: global rule (boundaries per table).

### 7.3 Sliders (speed, size)

- Track 4px, `--radius-full`, bg `--bg-surface-3` (dark) / `--border-subtle` (light); filled portion `--accent`.
- Thumb: 18px circle, bg `--text-primary`, 2px border `--accent`, `--shadow-1`; **44px invisible hit area**.
- Hover: thumb scale 1.15. Active/drag: scale 1.25, filled track → `--accent-hover`. Focus: ring on thumb. Disabled: global + thumb border `--border-strong`.
- Value readout right-aligned beside label, mono 12px: speed `40 steps/s` (range 1–240, log-scaled detents), size `100 elements` (range 5–200). Native `<input type="range">` styled; `aria-valuetext` set to the readable readout.

### 7.4 Algorithm select

- Closed: 40px height (44px mobile), `--radius-md`, bg `--bg-surface-2`, border `--border-subtle`, text `--text-primary` 16px/500, chevron `--text-muted` (rotates 180° on open, `--duration-base`).
- Hover: border `--border-strong`. Open: border `--accent`, panel = surface-3, `--radius-md`, `--shadow-3`, 4px offset below, options 40px rows.
- Option row: name (Inter 14/500) + average complexity right-aligned (mono 12px `--text-muted`, e.g. `O(n log n)`). Hover/highlight: bg `--accent-soft`. Selected: check icon + text `--accent`.
- Focus: ring. Disabled (while running): global rule.
- Implement as accessible listbox (or styled native `<select>` on mobile). Keyboard: arrows navigate, Enter selects, Esc closes.

### 7.5 Preset chips + Shuffle

- Shuffle: 32px (44 mobile) pill button, bg `--accent-soft`, text `--accent`, icon ⤨; hover bg 20% mix; active scale(0.97).
- Presets (Random / Nearly-sorted / Reversed / Few-unique): 32px (44 mobile) pills, bg transparent, border `--border-subtle`, text `--text-secondary` 13px/500. Hover: border `--border-strong`, text `--text-primary`. Selected (last applied): bg `--accent-soft`, border transparent, text `--accent`. Focus ring; disabled per table. Radio-group semantics (`role="radiogroup"`).

### 7.6 Theme toggle (and sound toggle, stretch)

- 40px icon button, ghost style (as §7.2). Icon: sun/moon, cross-fades + rotates 90° over `--duration-base` (no rotation under reduced motion).
- `aria-pressed` + label "Switch to light/dark theme". Persists to `localStorage.vissort-theme`.
- Sound toggle (S3, §9): same button style; speaker-off icon default. ON state: icon `--accent` + 4px accent dot badge top-right (visible audible-state indicator), `aria-pressed="true"`, tooltip "Sound on".

### 7.7 Stat cards

- Surface-1, border `--border-subtle`, `--radius-lg`, padding `--space-4`; label `--text-sm` uppercase `--text-secondary`; value `--text-stat` mono `--text-primary`.
- Values are pure derived output from driver position (F7) — **no animation on change** (at 200 steps/s any flash is noise); mono guarantees no layout shift. Thousands separators.
- "Step" card shows `current / total` (e.g. `1,532 / 3,940`).
- Non-interactive: no hover/focus states (not in tab order).

### 7.8 Info panel

- Surface-1, border `--border-subtle`, `--radius-lg`, padding `--space-5`.
- **Exact fields:** algorithm name (Bricolage `--text-lg`) · description (2–4 sentences, `--text-base` `--text-secondary`) · Big-O table · stability badge.
- Big-O table: 4 rows — Best / Average / Worst (time) / Space. Labels Inter 13 `--text-secondary` left; values mono 13 `--text-primary` right; 1px `--border-subtle` row dividers; worst-time row value tinted `--color-bar-swapping` *only if* worst ≠ average (a quiet teaching cue).
- Stability badge: pill, 12px/500 — Stable: text+border in `--color-bar-sorted` at full hex, 10% bg tint, ✓ icon; Not stable: `--text-muted` border/text, ⚠ icon (icon + wording carry meaning, not color alone).
- Content switches on algorithm change with a 150ms cross-fade (`--ease-out`); no motion under reduced-motion.
- Tablet/mobile accordion header: same panel, whole header row is the 44px toggle button, chevron rotates; `aria-expanded`.

### 7.9 Keyboard hint strip

- Inside control bar, `--text-xs` mono `--text-muted`: `Space` Play/Pause · `←` `→` Step · `R` Reset. Keys rendered as `<kbd>` chips: surface-3 bg, border-subtle, radius-sm, 2px 6px padding. Hidden below `md` (functionality remains; shortcuts don't fire while a form control is focused, per F6).

---

## 8. UI motion spec (chrome, not bars)

| Event | Motion | Duration/easing | Reduced-motion |
|---|---|---|---|
| Hover/press states | color/border/shadow; scale(0.97) press | fast / ease-out | color only |
| Select open/close | opacity + translateY(-4→0) | base / ease-out (in), fast / ease-in (out) | opacity only |
| Accordion expand | grid-template-rows 0fr→1fr + chevron 180° | slow / ease-in-out | instant, no chevron spin |
| Theme switch | single cross-fade: `transition: background-color, color, border-color` on token consumers | slow, linear | instant |
| Status pill in/out | opacity + translateY(6→0) | base / ease-out | opacity only |
| Icon swaps (play↔pause, sun↔moon) | cross-fade (+90° rotate for theme) | fast–base | cross-fade only |
| Header aurora | transform drift, 18s alternate | linear | static gradient |

Never animate: `width/height/top/left` of layout elements (use transform/grid-rows), `backdrop-filter`, anything during active playback other than the bars themselves and stat text updates.

---

## 9. Stretch UX — race mode & sound (D6)

### 9.1 Race mode (S4) layout

Desktop (≥1024px):
```
├──────────────────────────────────────────────┬───────────────┤
│ ┌ Quick Sort ──── cmp 812 · swp 240 ─┐       │ SIDEBAR:      │
│ │  ▂▄▆█▃▅▇▁▂▆▄█▅▃▇▆   [pane A canvas]│       │ head-to-head  │
│ └─────────────────────────────────────┘      │ table:        │
│ ┌ Heap Sort ──── cmp 1,104 · swp 388 ─┐      │  rows: cmp /  │
│ │  ▂▄▆█▃▅▇▁▂▆▄█▅▃▇▆   [pane B canvas]│       │  swaps / acc /│
│ └─────────────────────────────────────┘      │  steps; cols  │
│  CONTROL BAR (shared — one transport,        │  A | B; mono  │
│  one speed; size/preset apply to both)       │               │
```
- Two panes stacked (or side-by-side `1fr 1fr` if viewport ≥1440px and n ≤ 60), gap `--space-4`; each pane: mini-header (algorithm name Bricolage 14 + inline mono mini-stats 12px) + its own canvas; identical input copies, synchronized start (driver contract from PLAN §4).
- Per-pane cap: 100 elements in race mode (size slider max drops to 100; ≥30fps target per F12).
- **Winner treatment:** first pane to finish plays the §5.5 sweep + a "Finished 1st" pill (accent bg, on-accent text); the other keeps running, then gets a muted "Finished 2nd" pill. No confetti — the sweep is the celebration.
- Mobile: panes stack vertically ~30vh each above the fixed bottom transport; head-to-head table replaces the standard stats grid.
- Entry point: "Race" ghost toggle button beside the algorithm select; when active, a second algorithm select appears beside the first (A vs B).

### 9.2 Sound mode (S3) UX

- Toggle in header per §7.6: **off by default**, ON state has the accent icon + dot badge (visible audible-state indicator) and `aria-pressed`.
- AudioContext is created/resumed **inside the toggle's click handler** (satisfies autoplay policy; no console errors on rapid toggling — guard with a single lazily-created context).
- Sound design: triangle oscillator, pitch mapped linearly from bar value to 220–880Hz, 30ms attack/60ms release blips on compare/swap; master gain 0.08 (quiet by design). At ≥20 steps/s, throttle to max 1 blip per 40ms (audio must never backpressure the render loop).

---

## 10. Decisions the frontend-developer must not deviate from

1. Token names/values in §2 & §5.1 exactly as written; components consume **tokens only, never raw hex**.
2. Fonts **self-hosted via @fontsource** (Bricolage Grotesque / Inter / JetBrains Mono) — no CDN font links (offline requirement).
3. All live-updating numerals in JetBrains Mono (layout-shift guarantee).
4. Bar movement via `transform` only; glow only on comparing/swapping/pivot; **all bar transitions off at ≥20 steps/s**; no WebGL.
5. The 6 bar states keep their secondary non-hue cues (luminance tiers, pivot chevron, overwrite top cap, glow/motion) — CVD safety depends on them.
6. Theme applied to `<html data-theme>` pre-paint; persisted; OS preference default.
7. `prefers-reduced-motion` fallbacks per §2.5/§5.4/§5.5/§8 — color feedback stays, movement goes.
8. Focus-visible two-ring halo on every interactive element; disabled logic per §7 table.
9. Touch targets ≥44px on mobile; fixed bottom transport bar on `sm`.
10. Exactly one glass layer (control bar) and one decorative flourish (header aurora) — nothing else gets blur, glow, or ambient animation.

---

## 11. 3D Crane view (D7)

> Added 2026-07-26. Implements [PLAN.md](./PLAN.md) §FC1–FC9. This section
> documents the view **as built** in `src/components/three/CraneView.tsx`.
>
> **It is now the "Columns" view.** It began as an opt-in fourth mode; it has
> since replaced the flat 2D bar canvas as the Visualizer's primary view, so the
> switch is back to three options (Columns / Array / Tree). `BarCanvas` still
> backs the Compare page's race, which runs far too fast to stage physically.
> The Visualizer therefore defaults to **16 values at 1 step/s** — a demo-sized
> shelf the crane can actually work, rather than 40 bars at 8 steps/s.
>
> **Scope note on §6.** §6 restricts the app to CSS-only depth, written for the
> 200-bar 2D canvas. The Crane is an explicitly opt-in, hard-capped, lazily
> loaded view — §6 continues to govern every other surface.

### 11.1 Concept

The sort staged as a physical **gantry crane** moving numbered boxes on a shelf:
box height = value, value printed on the front face. Inspired by an
@algomaster.io reel, rendered in VisSort's own quant-lab palette rather than the
reel's colors.

### 11.2 Scene

The rig is modelled as actual plant, not as primitives — a flat bar on a string
reads as a prototype, which is what it looked like before.

| Element | Spec |
|---|---|
| Shelf | Deck slab + inset machined working surface + front/back kerb rails |
| Legs | Box-section columns on base plates, corner gussets into the beam, amber hazard collars |
| Beam | An **I-beam** at `RAIL_Y = 5` — top flange, web, bottom flange — with amber end stops |
| Trolley | Wheeled carriage: amber housing, motor block, four rail wheels, hoist drum |
| Cables | **Twin** cylinders in a group scaled in Y to span trolley → block |
| Block | Sheave housing, amber spreader beam, dark machined under-plate, two hydraulic rams |
| Jaws | Hinged: knuckle pin, finger, **outward**-flared heel, black rubber grip pad. Dimensions scale with `boxW`, so they stay chunky hardware on a small shelf instead of thin wire |
| Camera | Fixed 3/4, fov 40, `[0, 3.5, 10.2]`, `lookAt(0, 2, 0)`, whisper of pointer parallax |
| Lighting | Neutral key + fill so box tokens read true; amber/lime rim lights placed **in front** of the gantry (z ≈ 7.5) so they graze boxes instead of blowing out the legs |

**Closed-jaw clearance is load-bearing geometry, not styling.** The closed
half-width is `boxW/2 + fingerW/2 + PAD_T`, which puts the pad's inner face
exactly on the box face and every other part of the gripper outside it. The heel
flares **outward**; it used to turn inward and drove straight through the side of
the column it was gripping. Tighten any of those three terms and the gripper
buries itself in the box again.

**No complexity pills on the canvas.** The info panel beside the stage already
lists best/average/worst/space, so on-canvas pills were duplicate furniture —
and being top-centred they sat directly in the trolley's path along the beam.

Boxes always fill a constant `WORLD_W = 11`, so `slot = WORLD_W / n` and the
camera never needs to move as `n` changes. Height maps
`BOX_H_MIN 0.32 → BOX_H_MAX 3.2`, normalized to the largest value present
(same rule as `BarCanvas`).

### 11.3 Color state machine

Colors are **read at runtime from the CSS tokens** (`readColors()`), never
hardcoded — the scene cannot drift from `tokens.css`.

| State | Token | Emissive |
|---|---|---|
| default | `--color-bar-default` | 0.04 |
| comparing | `--color-bar-comparing` | 0.55 |
| swapping | `--color-bar-swapping` | 0.70 |
| overwriting | `--color-bar-overwriting` | 0.60 |
| pivot | `--color-bar-pivot` | 0.50 |
| sorted | `--color-bar-sorted` | 0.28 |

Materials are born white, so the **first frame snaps** to the state color
(`userData.tinted`) — otherwise every box flashes white on mount.

### 11.4 Choreography — a bounded per-step timeline

Driven entirely by `steps[frame.index − 1]`; the engine is untouched.

**Not a chase.** The first implementation lerped every box toward its target with
exponential smoothing. An exponential chase never actually *arrives*, so at any
real playback speed the next step interrupted the previous one: boxes were
permanently in transit, motion read mushy, and the carry arc popped when it was
finally snapped. It is now **one clock per step**, running `0 → 1` over a bounded
duration and stopping, so every box lands exactly as the next step opens.

`duration = min(0.96 × stepInterval, 3000 ms)` while playing, 1100 ms when
paused for manual stepping. It must fit inside the player's own interval or the
next step cuts it off mid-grab — so **a slower machine means a slower step
rate**, and the two cannot be tuned independently.

The speed control is therefore a **1–5 level, not a raw step rate**
(`STEP_RATE` in `pages/Visualizer.tsx` maps level → steps/s:
`0.4, 0.7, 1.2, 2, 3.5`). Level 1 is ~2.5 s per step, giving the full
pick-and-place room to read; exposing the real rate meant fractional slider
values like 0.25 steps/s to reach the same place.

**The pick-and-place**, as fractions of that timeline (`PH`):

| Window | Phase |
|---|---|
| 0 → .14 | Trolley runs along the rail over the box; height unchanged |
| .14 → .30 | Hoist pays out; the open claw descends onto the box |
| .30 → .38 | Jaws close on it |
| .38 → .52 | Box is hoisted clear of the shelf |
| .52 → .72 | Trolley carries it across — **this is the only window in which any box moves sideways** |
| .72 → .86 | Box is lowered onto its new slot |
| .86 → .93 | Jaws release |
| .93 → 1 | Empty hook draws back up to travel height |

- **Only the box travelling right is lifted**; its partner slides along the shelf
  beneath it in the same window. Lifting both makes them intersect mid-air.
- The gripped box is **pinned to the hook** between `grip` and `placed`, with the
  pin eased out so it lands exactly on its slot rather than near it.
- Lift height is clamped to the headroom under the rail, so hoisting a tall box
  never drives the claw through the gantry.
- **The cable hangs plumb** — the trolley tracks the hook's x exactly. An earlier
  version let the hook trail and tilted the cable; near the rail the vertical run
  is tiny, so `atan2` turned a few centimetres of lag into a ~45° tilt and the rig
  read as a snapped, flailing arm. Removed deliberately; do not reintroduce
  without clamping against the *rendered* endpoints, not just the angle.
**The empty hook follows the algorithm's cursor, and stays up.** It stands over
the column currently being examined and walks the shelf column by column rather
than floating to the midpoint of a compared pair — but it holds **travel
height** while doing so. A comparison moves nothing, so there is nothing to
reach down for; the hoist only pays out to pick a box up or to set a written
value down, and it draws back up to travel height the moment it lets go.

Picking that column is not as simple as "always `step.i`": the two compared
indices are not interchangeable across algorithms. Quicksort scans with `i`
against a **fixed** `j` (the pivot at `hi`); selection sort scans with `j`
against a **fixed** `i` (the running minimum). Anchoring on the wrong one leaves
the crane parked motionless for a whole pass. So the cursor is **whichever index
actually moved since the previous comparison**; when both move (bubble's adjacent
pair, merge's two runs) either reads as a sweep and the left one is used. Writes
and pivots use their own index, a swap ends over its destination, and
`divide`/`combine` leave the cursor where it was.

The hook's own travel is a bounded two-beat move on the same clock — traverse
along the rail, then take up or pay out the hoist — not an exponential chase.
Once it arrives it hangs and breathes rather than freezing dead.

| Step | Behaviour | Label |
|---|---|---|
| `compare{i,j}` | Pair glows; claw hovers between them | `a[i] > a[j] ?` |
| `swap{i,j}` | Right-moving box arcs over; partner slides | `swap a[i], a[j]` |
| `overwrite{index,value}` | Claw descends; box morphs height | `write v → a[i]` |
| `markPivot{index}` | Purple highlight; claw moves over it | `pivot = a[i]` |
| `markSorted` | Boxes lock lime | — |
| `divide` / `combine` | Ignored (tree-view annotations) | — |

### 11.5 Degradation

- **`n > 32`** — non-destructive notice + "Shrink to 16 boxes" button. The array
  is never silently truncated; the visitor chooses.
- **`n > 20`** — number labels hidden (faces become unreadable).
- **Speed ≥ 20 steps/s** — `SNAP_SPEED`, same threshold as `BarCanvas`: the claw
  parks and boxes snap. A 1.5 s pick-and-place cannot play at 40 steps/s.
- **`prefers-reduced-motion`** — identical to snap: no arcs, no drift, no bob;
  state stays fully legible through color.

### 11.6 Overlays

Complexity pills (TIME **average-case**, labeled `avg`, + SPACE) top-center;
action label bottom-center; the existing `PSEUDOCODE[algorithmKey]` in a footer
with the current line highlighted in lock-step. On completion the label becomes
a lime **"Sorted!"** pill.

### 11.7 Performance & lifecycle

- Lazy-loaded — three.js reaches only visitors who open the view (`CraneView`
  is its own ~10 kB chunk; the Visualizer chunk is unchanged at ~26 kB).
- `dpr={[1,2]}`, `ContactShadows` instead of per-box shadow maps.
- Number-label `CanvasTexture`s are cached per value and disposed on unmount —
  no webfont fetch, no leak.
- **`resize={{ debounce: { resize: 0 } }}` is required.** With r3f's default
  200 ms debounce, toggling view modes faster than that drops the pending
  measurement and the canvas is stranded at its unsized 300×150 default,
  rendering nothing. Verified with 16 rapid toggles: one canvas, no context loss.

---

## 12. Array & Structure views — the "true structure" system

Added when the Array and Tree views were rebuilt. The user's brief for the Array
view was explicit: *"we can make it simple but have an idea like not just blocks
divide — divide the array into groups visually according to the sorting method."*
So the visual interest here comes from **the structure being true**, not from
effects. No 3D, no glass stacking. What earns parity with the Crane is precision,
legible motion and typography — the same instrument, flattened.

### 12.1 Where the structure comes from

Nothing in these views infers structure from pixels or re-implements an
algorithm. Each generator declares its own carve-up on every step via
`Step.ctx.groups` (see `src/engine/types.ts`), and the views render exactly that.

**Contract:** a step's `ctx` describes the array **after** that step applies.
Views read it with `contextAt(steps, frame.index)`, and the frame at index `k` is
the state after `steps[k-1]`. Building groups from the pre-step state puts every
label one step behind — during development this produced a `>= 75` bracket
spanning the value `39`. Unit tests written from the same assumption did not
catch it; rendering it did.

**Invariant:** groups are non-overlapping, ascending, and cover exactly `0…n-1`.
Enforced in `stepContext.test.ts` for all six algorithms across every input shape.

"Final" is deliberately **not** a group kind. It is derived from
`frame.state === 'sorted'`, so grouping and finality are two independent channels
that cannot disagree.

### 12.2 Group tints

Low-saturation fills over the existing palette. The per-cell state colours
(`comparing`, `swapping`, `overwriting`, `pivot`, `sorted`) must always win — a
group tint is context, not emphasis.

| Kind | Fill | Border | Reads as |
| --- | --- | --- | --- |
| `ordered` | `--lime` 12% | `--lime` 34% | in order, but *not* final |
| `merged` | `--lime` 12% | `--lime` 30% | written, in order |
| `scanned` | `--accent` 10% | `--accent` 30% | already examined this pass |
| `heap` | `--accent` 12% | `--accent` 30% | the live max-heap |
| `lessThan` | `--color-bar-overwriting` 14% | 34% | proven `< pivot` |
| `greaterThan` | `--color-bar-swapping` 13% | 32% | proven `>= pivot` |
| `pivot` | `--color-bar-pivot` 20% | 45% | the pivot cell |
| `unsorted` / `unexamined` | `--color-bar-default` 22% / 14% | `--border-subtle` | in play, no finer structure |
| `outside` | transparent | none | another branch / already locked |

`ordered` vs `outside` is load-bearing for insertion sort: its prefix is sorted
but a later value can still slide into the middle of it. Rendering that as
"final" would teach the wrong thing.

### 12.3 Array view geometry

- Groups are separated by **22 px** versus **6 px** between cells inside a group.
  That ratio is what makes the carve-up read as separate blocks rather than a
  colour wash — it is the core of the user's request and should not be reduced.
- Each group gets a tinted backing panel (`+3 px` bleed) and a labelled bracket
  above it. Panels and brackets **resize**; they never fade out and back in,
  because a bracket blinking every step reads as noise rather than structure.
- Cells carry a proportional value fill behind the number, tying this view back
  to the Columns bars. On a state-coloured cell the fill becomes a neutral
  darkening so it cannot muddy the state colour.
- Below **22 px** cell width, values are hidden and cells become pure state
  chips, with a one-line "shrink to 24" offer reusing the Crane's existing
  `onShrink` callback.
- The row does not wrap. It scrolls horizontally with cursor auto-follow; a
  manual scroll wins for **3 s** so the user can look around without being
  yanked back.

### 12.4 Motion

| Event | Treatment | Duration |
| --- | --- | --- |
| swap | low SVG arc between the exchanging positions | `min(220ms, 0.9 × step)` |
| overwrite | outward scale pulse on the destination cell | `min(260ms, 0.9 × step)` |
| group resize | `transform` + `width` transition | `clamp(40ms, 0.8 × step, 180ms)` |

All motion is dropped entirely at `SNAP_SPEED` and under
`prefers-reduced-motion`; colour feedback survives.

### 12.5 Structure view

One shell, three bodies, chosen by what the algorithm actually is:

- **Recursion tree** (merge, quick) — real tree layout, children centred beneath
  their parent and siblings spaced by subtree width. Node states are `pending`
  (dashed), `active` (accent), `combining` (`--color-bar-overwriting` with a
  progress fill from real write counts) and `returned` (lime).
- **Heap tree** (heapsort) — layout computed from `n` and depth alone, never from
  the measured container (the previous version derived height from a value that
  depended on it). Minimum node spacing **36 px** against radius **15 px**;
  verified non-overlapping at n=200. Only the live heap is drawn — extracted
  values move to a "final" strip below.
- **Pass ladder** (bubble, insertion, selection) — one row per pass with its
  working window and comparison cost, so the quadratic shape reads as an area.

Shared across all three: a **pinned array ribbon** with the active range
bracketed. This is the tree↔array link the old view lacked entirely — it drew
ranges like `4–7` with nothing on screen connecting those numbers to elements.

Depth is capped at **12** with an honest count of what is hidden; quicksort's
worst case at n=200 is depth ~200, which previously rendered a ~5000 px column.
Both trees use a real `viewBox`.
