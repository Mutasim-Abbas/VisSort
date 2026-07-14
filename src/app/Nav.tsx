import { NavLink, Link } from 'react-router-dom';

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/visualize', label: 'Visualizer' },
  { to: '/compare', label: 'Compare' },
  { to: '/learn', label: 'Learn' },
];

/**
 * Floating liquid-glass navbar: serif logo coin on the left, a glass pill of
 * links in the center (desktop). Fixed, so page content scrolls underneath the
 * glass. VisSort is dark-only, so there is no theme switch.
 */
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="VisSort home"
          className="liquid-glass grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-2xl italic leading-none text-primary"
        >
          V
        </Link>

        <nav
          aria-label="Primary"
          className="liquid-glass hidden items-center rounded-full p-1.5 md:flex"
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-fast ${
                  isActive ? 'bg-accent text-on-accent' : 'text-primary/90 hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/visualize"
            className="ml-1.5 whitespace-nowrap rounded-full bg-lime px-4 py-2 text-sm font-semibold text-on-lime transition-transform duration-fast active:scale-95"
          >
            Start sorting
          </Link>
        </nav>

        {/* Balances the logo coin so the nav pill stays optically centred. */}
        <div className="h-12 w-12 shrink-0" aria-hidden="true" />
      </div>

      {/* Mobile: full-width scrollable pill row. Links are ≥44px tall so they
          are a real touch target, not a mouse target shrunk down. */}
      <nav
        aria-label="Primary mobile"
        className="liquid-glass mt-2 flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 md:hidden"
      >
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-fast ${
                isActive ? 'bg-accent text-on-accent' : 'text-primary/90'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
