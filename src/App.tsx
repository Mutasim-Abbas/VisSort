import { lazy } from 'react';
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { Layout } from './app/Layout';

// Code-split every page so the heavy Three.js hero only loads on Home and each
// route ships its own chunk.
const Home = lazy(() => import('./pages/Home'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Visualizer = lazy(() => import('./pages/Visualizer'));

/**
 * VisSort is a multi-page experience. HashRouter is used so deep links work
 * when the built site is served as static files (no server rewrite needed) —
 * important for the "run locally now, publish later" plan.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/visualize" element={<Visualizer />} />
          {/* Retired pages (/compare, /learn) and typos land on Home. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
