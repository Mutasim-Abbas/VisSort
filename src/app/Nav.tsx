import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon } from '../components/icons';

const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/visualize', label: 'Visualizer' },
];

/** Three rising bars — the logo mark, drawn in the accent. */
function LogoMark() {
  return (
    <span aria-hidden="true" className="flex h-[18px] w-5 items-end gap-0.5">
      <span className="h-[45%] flex-1 rounded-[2px] bg-accent opacity-45" />
      <span className="h-full flex-1 rounded-[2px] bg-accent" />
      <span className="h-[70%] flex-1 rounded-[2px] bg-accent opacity-70" />
    </span>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title="Toggle light / dark"
      className="grid h-9 w-9 place-items-center rounded-full bg-fill text-secondary transition-colors duration-fast hover:bg-fill-2 hover:text-primary"
    >
      {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  );
}

/**
 * Sticky header: wordmark left, a segmented control of the three pages in the
 * middle, the theme toggle right. The 1fr/auto/1fr grid keeps the segments
 * optically centred whatever the two sides hold. On a phone the wordmark drops
 * to its mark and the segments tighten so all three still fit in one row.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 grid h-[60px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b-[0.5px] border-hair bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-4 backdrop-blur-md sm:gap-4 sm:px-5">
      <Link
        to="/"
        aria-label="VisSort home"
        className="flex items-center gap-2.5 justify-self-start rounded-lg px-1 py-1.5 text-primary"
      >
        <LogoMark />
        <span className="hidden text-[17px] font-[650] tracking-[-0.01em] sm:inline">VisSort</span>
      </Link>

      <nav aria-label="Primary" className="flex gap-0.5 rounded-full bg-fill p-[3px]">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-full px-3 py-[7px] text-sm transition-colors duration-base sm:px-4 ${
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
      </div>
    </header>
  );
}
