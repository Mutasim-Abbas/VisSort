/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// This config runs in Node, but the project has no @types/node — declare the
// single field read below rather than pull in the whole type package for it.
declare const process: { env: Record<string, string | undefined> };

/**
 * GitHub Pages serves this as a *project site*, so production assets need the
 * repo name as a prefix. Vercel serves it at the domain root, where that same
 * prefix points at paths that do not exist — the page loads but every
 * stylesheet, script and asset 404s, leaving raw unstyled HTML.
 *
 * Vercel sets VERCEL=1 during its builds, so one config deploys correctly to
 * both targets. Dev is always served from the root.
 */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' && !process.env.VERCEL ? '/VisSort/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
}));
