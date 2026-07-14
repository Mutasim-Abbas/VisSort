/** Small helpers shared by the algorithm generators. */

/** `[0, 1, …, n-1]` — used for the final "everything is sorted" markSorted. */
export function range(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  return out;
}
