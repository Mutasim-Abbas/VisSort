import { Link } from 'react-router-dom';

const ArrowRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-[1120px] flex-col items-center px-6 pt-24 text-center">
        <p className="mb-[18px] text-[15px] font-medium text-secondary">
          Six sorting algorithms, one decision at a time
        </p>
        <h1 className="text-balance text-[clamp(44px,7vw,80px)] font-bold leading-[1.02] tracking-[-0.04em]">
          See how sorting thinks.
        </h1>
        <p className="mt-[22px] max-w-[600px] text-pretty text-[clamp(17px,1.6vw,21px)] leading-[1.45] text-secondary">
          Watch every comparison, swap and write happen on your own numbers — as flat bars, or with
          a 3D crane that physically moves each value into place.
        </p>
        <Link
          to="/visualize"
          className="mt-[34px] flex items-center gap-2 rounded-full bg-accent px-[26px] py-3.5 text-[17px] font-semibold text-on-accent shadow-[0_6px_18px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-[transform,filter] duration-base ease-spring hover:-translate-y-px hover:brightness-[1.06] active:scale-[0.98]"
        >
          Open the visualizer
          <ArrowRight />
        </Link>
      </section>
    </div>
  );
}
