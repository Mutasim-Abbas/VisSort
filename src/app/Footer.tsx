export function Footer() {
  return (
    <footer className="border-t border-subtle bg-surface-1">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row">
        <p>
          <span className="wordmark font-semibold">VisSort</span> — sorting algorithm visualizer
        </p>
        <p>
          Designed &amp; built by{' '}
          <span className="font-medium text-secondary">Mutasim Abbas</span>
        </p>
      </div>
    </footer>
  );
}
