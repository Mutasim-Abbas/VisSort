import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon } from '../components/icons';

export const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/visualize', label: 'Visualizer' },
  { to: '/compare', label: 'Compare' },
  { to: '/learn', label: 'Learn' },
];

/** Three rising bars — the logo mark, drawn in the accent. */
export function LogoMark() {
  return (
    <span aria-hidden="true" className="flex h-[18px] w-5 items-end gap-0.5">
      <span className="h-[45%] flex-1 rounded-[2px] bg-accent opacity-45" />
      <span className="h-full flex-1 rounded-[2px] bg-accent" />
      <span className="h-[70%] flex-1 rounded-[2px] bg-accent opacity-70" />
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full bg-fill text-secondary transition-colors duration-fast hover:bg-fill-2 hover:text-primary"
    >
      {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  );
}

/**
 * Sticky header: wordmark left, a segmented control of pages in the middle,
 * the theme toggle right. The 1fr/auto/1fr grid keeps the segments optically
 * centred whatever the two sides hold.
 *
 * Five segments do not fit across a phone, so below `md` they fold into a
 * tap-to-open menu where every page is a full-width 48px row.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 grid h-[60px] shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-b-[0.5px] border-hair bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-4 backdrop-blur-md sm:px-5 md:grid-cols-[1fr_auto_1fr]">
      <Link
        to="/"
        aria-label="VisSort home"
        className="flex items-center gap-2.5 justify-self-start rounded-lg px-1 py-1.5 text-primary"
      >
        <LogoMark />
        <span className="text-[17px] font-[650] tracking-[-0.01em]">VisSort</span>
      </Link>

      <nav aria-label="Primary" className="hidden gap-0.5 rounded-full bg-fill p-[3px] md:flex">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-full px-4 py-[7px] text-sm transition-colors duration-base ${
                isActive
                  ? 'bg-surface font-semibold text-primary shadow-sm'
                  : 'font-medium text-secondary hover:text-primary'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 justify-self-end">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-full bg-fill text-secondary transition-colors duration-fast hover:bg-fill-2 hover:text-primary md:hidden"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          aria-label="Primary mobile"
          className="rise-in absolute inset-x-3 top-[64px] flex flex-col gap-1 rounded-[20px] bg-surface p-2 shadow-lg md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[48px] items-center rounded-[14px] px-4 text-base transition-colors duration-fast ${
                  isActive
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'font-medium text-primary active:bg-fill'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
