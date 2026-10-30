/** Filled when the algorithm is stable, an outline when it is not. */
export function StableBadge({ stable, className = '' }: { stable: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${
        stable ? 'border-primary bg-primary text-surface' : 'border-hair text-secondary'
      } ${className}`}
    >
      {stable ? '✓ Stable' : 'Unstable'}
    </span>
  );
}
