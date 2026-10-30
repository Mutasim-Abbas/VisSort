import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'vissort-theme';
const root = () => document.documentElement;

/**
 * The theme lives on `<html data-theme>`. index.html sets it before first paint
 * (stored choice, else the system preference), so this store only reads it back
 * and writes changes through. Several components need it at once — the header
 * toggle, and the crane, whose lit boxes use their own per-theme palette — so
 * it is one shared store rather than per-component state.
 */
const listeners = new Set<() => void>();

function read(): Theme {
  return root().dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(theme: Theme) {
  const el = root();
  // A short-lived class cross-fades every surface (see index.css).
  el.classList.add('theme-switching');
  el.dataset.theme = theme;
  window.setTimeout(() => el.classList.remove('theme-switching'), 340);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'light' as Theme);
  const toggle = useCallback(() => setTheme(read() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}
