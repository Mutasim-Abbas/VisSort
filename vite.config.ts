/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deployed to GitHub Pages under /VisSort/, but served from / in dev.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/VisSort/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
}));
