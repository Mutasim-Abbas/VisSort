import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Footer } from './Footer';

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-subtle border-t-accent" />
    </div>
  );
}

/** Warm glow that follows the pointer (desktop only, CSS-var driven). */
function Spotlight() {
  useEffect(() => {
    const root = document.documentElement;
    const onMove = (e: MouseEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return <div className="spotlight" aria-hidden="true" />;
}

export function Layout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-page text-primary">
      <Nav />
      <Spotlight />
      <div className="grain" aria-hidden="true" />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          {/* Keying by pathname re-runs the enter animation on every route. */}
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
