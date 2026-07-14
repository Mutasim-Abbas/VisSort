import { useLayoutEffect, useRef, useState } from 'react';

export interface Size {
  width: number;
  height: number;
}

/**
 * Tracks an element's size. Measured synchronously on mount (so the first
 * paint already has real dimensions, even in throttled/background tabs where
 * ResizeObserver delivery is frozen), then kept fresh via ResizeObserver.
 */
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T>, Size] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
