import type { Config } from 'tailwindcss';

/**
 * All colors map 1:1 to the CSS-variable design tokens defined in
 * src/styles/tokens.css (docs/DESIGN.md §2). Components must use these
 * utilities (or the vars directly in component CSS) — never raw hex.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NOTE: deliberately NOT named `base`. Tailwind already ships a
        // `text-base` font-size utility, and a color named `base` generates a
        // competing `text-base` color rule that silently wins — painting text
        // in the page background color. Keep color names clear of font sizes
        // (base, xs, sm, lg, xl…).
        page: 'var(--bg-base)',
        canvas: 'var(--bg-canvas)',
        'surface-1': 'var(--bg-surface-1)',
        'surface-2': 'var(--bg-surface-2)',
        'surface-3': 'var(--bg-surface-3)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-active': 'var(--accent-active)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
        lime: 'var(--lime)',
        'lime-hover': 'var(--lime-hover)',
        'lime-active': 'var(--lime-active)',
        'lime-soft': 'var(--lime-soft)',
        'on-lime': 'var(--on-lime)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        focusring: 'var(--focus-ring)',
        'bar-default': 'var(--color-bar-default)',
        'bar-comparing': 'var(--color-bar-comparing)',
        'bar-swapping': 'var(--color-bar-swapping)',
        'bar-pivot': 'var(--color-bar-pivot)',
        'bar-overwriting': 'var(--color-bar-overwriting)',
        'bar-sorted': 'var(--color-bar-sorted)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        e1: 'var(--shadow-1)',
        e2: 'var(--shadow-2)',
        e3: 'var(--shadow-3)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-quick': 'cubic-bezier(0.4, 0, 1, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
