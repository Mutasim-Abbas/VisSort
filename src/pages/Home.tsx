import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroScene } from '../components/three/HeroScene';

const ROTATING_WORDS = ['Sorting', 'Bubble Sort', 'Merge Sort', 'Quicksort', 'Heapsort'];

/** The middle of the headline cycles through the algorithms, re-blurring in. */
function RotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2600);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <span key={idx} className="blur-word text-accent" style={{ marginRight: '0.28em' }}>
      {ROTATING_WORDS[idx]}
    </span>
  );
}

/** Fade + parallax the hero copy away as the visitor scrolls. */
function useHeroParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.opacity = String(Math.max(0, 1 - y / 520));
      el.style.transform = `translateY(${y * 0.18}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return ref;
}

const ArrowUpRight = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

const PlayGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

function StatCard({
  value,
  label,
  delay,
  icon,
}: {
  value: string;
  label: string;
  delay: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="liquid-glass rise-in flex w-[220px] flex-col justify-between rounded-[1.25rem] p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-primary">{icon}</span>
      <div className="mt-6">
        <p className="font-display text-4xl italic leading-none tracking-[-1px] text-primary">
          {value}
        </p>
        <p className="mt-2 text-xs font-light text-primary/90">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* ---------------- Hero: full viewport, 3D scene under glass ---------------- */}
      <section className="relative flex min-h-screen w-full flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroScene style={{ width: '100%', height: '100%' }} />
        </div>

        {/*
          Readability scrim. The 3D bars are bright lime/amber, so the copy needs
          a real darkening layer between the scene and the text — a soft ellipse
          behind the centre column plus top/bottom gradients to seat the nav and
          the brand row.
        */}
        <div className="hero-scrim pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />

        <HeroContent />
      </section>

      <CapabilitiesSection />
    </div>
  );
}

function HeroContent() {
  const parallaxRef = useHeroParallax();
  return (
    <>
      <div
        ref={parallaxRef}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center md:pt-28"
      >
        {/* Headline — the algorithm name cycles, re-blurring in each time */}
        <h1
          className="flex max-w-4xl flex-wrap justify-center font-display text-5xl italic leading-[0.9] tracking-[-2px] text-primary sm:text-6xl md:text-7xl md:tracking-[-3px] lg:text-[5.5rem]"
          style={{ rowGap: '0.1em' }}
        >
          <span className="blur-word" style={{ marginRight: '0.28em', animationDelay: '500ms' }}>
            Watch
          </span>
          <RotatingWord />
          <span className="blur-word" style={{ marginRight: '0.28em', animationDelay: '700ms' }}>
            Come
          </span>
          <span className="blur-word" style={{ animationDelay: '800ms' }}>
            Alive
          </span>
        </h1>

        {/* Subheading */}
        <p
          className="rise-in mt-5 max-w-2xl text-sm font-light leading-tight text-primary md:text-base"
          style={{ animationDelay: '800ms' }}
        >
          Eight classic algorithms animated step by step — with your own numbers, live statistics,
          adjustable speed and sound. Built for building intuition, made for the classroom.
        </p>

        {/* CTAs */}
        <div className="rise-in mt-7 flex items-center gap-6" style={{ animationDelay: '1100ms' }}>
          <Link
            to="/visualize"
            className="liquid-glass-strong flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary transition-transform duration-fast active:scale-95"
          >
            Start Your First Sort
            <ArrowUpRight />
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-2 text-sm font-medium text-primary/90 transition-colors duration-fast hover:text-primary"
          >
            <PlayGlyph />
            Race Two Algorithms
          </Link>
        </div>

        {/* Stat cards */}
        <div className="mt-10 flex flex-wrap items-stretch justify-center gap-4">
          <StatCard
            delay={1300}
            value="6"
            label="Classic algorithms, from Bubble to Heapsort"
            icon={
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
              </svg>
            }
          />
          <StatCard
            delay={1400}
            value="O(n log n)"
            label="See complexity happen, not just read it"
            icon={
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Brand row */}
      <div
        className="rise-in relative z-10 flex flex-col items-center gap-4 pb-8 pt-10"
        style={{ animationDelay: '1500ms' }}
      >
        <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-primary">
          Six classic algorithms, one playground
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-2 md:gap-x-16">
          {['Bubble', 'Insertion', 'Merge', 'Quick', 'Heap'].map((name) => (
            <span
              key={name}
              className="font-display text-2xl italic tracking-tight text-primary md:text-3xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------------- Capabilities ---------------- */
function CapabilitiesSection() {
  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-6 pb-20 pt-24">
      <p className="mb-6 text-sm text-primary/80">{'// What VisSort gives you'}</p>
      <h2 className="font-display text-5xl italic leading-[0.95] tracking-[-2px] text-primary md:text-6xl">
        Intuition,
        <br />
        visualized
      </h2>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: 'Your Numbers',
            tags: ['Custom Input', 'Presets', 'Up to 200 Items', 'Instant Reset'],
            body: 'Type any list of numbers and watch it sorted before your eyes — or generate random, reversed and nearly-sorted arrays in one click.',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
              </svg>
            ),
          },
          {
            title: 'Three Views',
            tags: ['Columns', 'Array Cells', 'Recursion Tree', 'Live States'],
            body: 'The same sort, three ways: cinematic columns, numbered array cells, and the recursion tree that shows divide-and-conquer actually dividing.',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
              </svg>
            ),
          },
          {
            title: 'Honest Numbers',
            tags: ['Comparisons', 'Swaps & Writes', 'Step Scrubbing', 'Big-O Tables'],
            body: 'Every comparison and write is counted from the real steps — scrub backwards and the statistics rewind with you. No fake animations.',
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
              </svg>
            ),
          },
        ].map((card) => (
          <div
            key={card.title}
            className="liquid-glass flex min-h-[300px] flex-col rounded-[1.25rem] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="liquid-glass grid h-11 w-11 shrink-0 place-items-center rounded-[0.75rem] text-primary">
                {card.icon}
              </span>
              <span className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
                {card.tags.map((t) => (
                  <span
                    key={t}
                    className="liquid-glass whitespace-nowrap rounded-full px-3 py-1 text-[11px] text-primary/90"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex-1" />
            <div className="mt-6">
              <h3 className="font-display text-3xl italic leading-none tracking-[-1px] text-primary md:text-4xl">
                {card.title}
              </h3>
              <p className="mt-3 max-w-[32ch] text-sm font-light leading-snug text-primary/90">
                {card.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
