import type { SVGProps } from 'react';

/**
 * Inline stroke icons (currentColor). Decorative by default — callers that use
 * an icon as the sole label of a control must supply an accessible name on the
 * control itself (aria-label).
 */
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M6 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none" />
  </Base>
);

export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const StepForwardIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M5 5l9 7-9 7z" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const StepBackIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M19 5l-9 7 9 7z" fill="currentColor" stroke="none" />
    <rect x="5.5" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const ResetIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
  </Base>
);

export const ShuffleIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M16 3h5v5" />
    <path d="M4 20L21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </Base>
);

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Base>
);

export const SoundOnIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </Base>
);

export const SoundOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    <path d="m16 9 5 6M21 9l-5 6" />
  </Base>
);
