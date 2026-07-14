/**
 * Recursion-tree models for the Tree view. Merge sort's segment tree is a pure
 * function of n; quicksort's partition tree is data-dependent, so it is
 * reconstructed by mirroring the exact (deterministic) partition logic of
 * `algorithms/quick.ts` without emitting steps. Heapsort needs no model — the
 * array *is* a binary tree by position.
 */

export interface Segment {
  lo: number;
  hi: number;
  depth: number;
  children: Segment[];
}

export function buildMergeSegments(n: number): Segment | null {
  if (n <= 0) return null;
  function build(lo: number, hi: number, depth: number): Segment {
    const seg: Segment = { lo, hi, depth, children: [] };
    if (hi - lo >= 1) {
      const mid = (lo + hi) >> 1;
      seg.children.push(build(lo, mid, depth + 1));
      seg.children.push(build(mid + 1, hi, depth + 1));
    }
    return seg;
  }
  return build(0, n - 1, 0);
}

export function buildQuickSegments(input: readonly number[]): Segment | null {
  const n = input.length;
  if (n === 0) return null;
  const a = input.slice();

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (a[j] < pivot) {
        if (i !== j) [a[i], a[j]] = [a[j], a[i]];
        i++;
      }
    }
    if (i !== hi) [a[i], a[hi]] = [a[hi], a[i]];
    return i;
  }

  function build(lo: number, hi: number, depth: number): Segment | null {
    if (lo > hi) return null;
    const seg: Segment = { lo, hi, depth, children: [] };
    if (lo < hi) {
      const p = partition(lo, hi);
      const left = build(lo, p - 1, depth + 1);
      const right = build(p + 1, hi, depth + 1);
      if (left) seg.children.push(left);
      if (right) seg.children.push(right);
    }
    return seg;
  }

  return build(0, n - 1, 0);
}

export function maxDepth(seg: Segment | null): number {
  if (!seg) return 0;
  let d = seg.depth;
  for (const c of seg.children) d = Math.max(d, maxDepth(c));
  return d;
}

/** Flatten the tree into a render list. */
export function flatten(seg: Segment | null): Segment[] {
  const out: Segment[] = [];
  if (!seg) return out;
  const stack = [seg];
  while (stack.length) {
    const s = stack.pop()!;
    out.push(s);
    for (const c of s.children) stack.push(c);
  }
  return out;
}

/**
 * The deepest segment that contains every index in `positions` — i.e. the
 * recursion call currently doing the work when those indices are highlighted.
 */
export function deepestContaining(seg: Segment | null, positions: readonly number[]): Segment | null {
  if (!seg || positions.length === 0) return null;
  let lo = positions[0];
  let hi = positions[0];
  for (const p of positions) {
    if (p < lo) lo = p;
    if (p > hi) hi = p;
  }
  if (lo < seg.lo || hi > seg.hi) return null;
  let node = seg;
  for (;;) {
    const child = node.children.find((c) => lo >= c.lo && hi <= c.hi);
    if (!child) return node;
    node = child;
  }
}
