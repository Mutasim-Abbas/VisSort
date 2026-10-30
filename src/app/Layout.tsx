import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Footer } from './Footer';

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-hair border-t-accent" />
    </div>
  );
}

/**
 * The Visualizer is a full-height workspace (sidebar, stage, details) that
 * fills the window under the header, so it gets no footer. Every other page
 * scrolls and ends on one.
 */
const FULL_HEIGHT = new Set(['/visualize']);

export function Layout() {
  const { pathname } = useLocation();
  const fullHeight = FULL_HEIGHT.has(pathname);
  return (
    <div className="flex min-h-screen flex-col bg-page text-primary">
      <Nav />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<PageFallback />}>
          {/* Keying by pathname re-runs the enter animation on every route. */}
          <div key={pathname} className="page-enter flex flex-1 flex-col">
            <Outlet />
          </div>
        </Suspense>
      </main>
      {!fullHeight && <Footer />}
    </div>
  );
}
