import type { Step } from './types';

/**
 * Recursion-tree model derived from the *actual emitted steps*, in one pass.
 *
 * Two things this deliberately does not do:
 *
 * 1. It does not re-implement any algorithm. The old `buildQuickSegments`
 *    mirrored quicksort's Lomuto partition, so the tree and the animation were
 *    two copies of the same logic that could silently disagree. Here the tree is
 *    whatever the generator actually emitted.
 * 2. It does not rescan the step prefix per frame. Everything a frame needs is
 *    precomputed here and looked up by comparing the frame index against each
 *    node's step span, so rendering is O(nodes), not O(steps).
 *
 * The key structural fact it relies on: generators emit depth-first, so a call's
 * steps are *contiguous*. A node opened by `divide` owns every step until a later
 * `divide` appears whose range it does not contain.
 */

export type NodeState = 'pending' | 'active' | 'combining' | 'returned';

export interface TreeNode {
  id: string;
  lo: number;
  hi: number;
  depth: number;
  children: TreeNode[];
  /** Step index of the `divide` that opened this call. */
  openedAt: number;
  /** Index of the last step belonging to this call (inclusive). */
  closedAt: number;
  /** Step index of this node's own `combine`, if it has one (merge). */
  combineAt: number | null;
  /** Step indices of the writes this node's own combine performed (merge). */
  writeAt: number[];
  /** Final resting position of this call's pivot, if it has one (quick). */
  pivotPos: number | null;
  /** Step index at which the pivot was marked. */
  pivotAt: number | null;
}

export interface TreeModel {
  root: TreeNode | null;
  nodes: TreeNode[];
  maxDepth: number;
}

const contains = (n: TreeNode, lo: number, hi: number) => lo >= n.lo && hi <= n.hi;

/**
 * Build the model. Pure and cheap enough to memoize on `steps` alone — the step
 * list has stable identity for a given run.
 */
export function buildTreeModel(steps: readonly Step[]): TreeModel {
  const nodes: TreeNode[] = [];
  const stack: TreeNode[] = [];
  let root: TreeNode | null = null;
  let maxDepth = 0;

  const close = (node: TreeNode, at: number) => {
    node.closedAt = at;
  };

  for (let k = 0; k < steps.length; k++) {
    const s = steps[k];

    if (s.type === 'divide') {
      // Pop every open call that does not contain this new range: depth-first
      // emission means those calls have finished.
      while (stack.length > 0 && !contains(stack[stack.length - 1], s.lo, s.hi)) {
        close(stack.pop()!, k - 1);
      }
      const parent = stack[stack.length - 1] ?? null;
      const node: TreeNode = {
        id: `${s.lo}-${s.hi}-${k}`,
        lo: s.lo,
        hi: s.hi,
        depth: parent ? parent.depth + 1 : 0,
        children: [],
        openedAt: k,
        closedAt: steps.length - 1,
        combineAt: null,
        writeAt: [],
        pivotPos: null,
        pivotAt: null,
      };
      if (parent) parent.children.push(node);
      else root ??= node;
      nodes.push(node);
      stack.push(node);
      if (node.depth > maxDepth) maxDepth = node.depth;
      continue;
    }

    if (s.type === 'combine') {
      // A combine is emitted *after* both recursive calls have returned, so the
      // last child is still on the stack. Close every call strictly inside this
      // range before attributing the combine — without this, the final child of
      // each branch stays open until the end of the run and the tree only turns
      // green all at once (the original B1 defect).
      while (stack.length > 0) {
        const t = stack[stack.length - 1];
        const isThisCall = t.lo === s.lo && t.hi === s.hi;
        const isInsideThisCall = t.lo >= s.lo && t.hi <= s.hi;
        if (isThisCall || !isInsideThisCall) break;
        close(stack.pop()!, k - 1);
      }
      const owner = stack[stack.length - 1];
      if (owner && owner.lo === s.lo && owner.hi === s.hi) owner.combineAt = k;
      continue;
    }

    const top = stack[stack.length - 1];
    if (!top) continue;

    if (s.type === 'overwrite' && top.combineAt !== null) {
      // Attribute the write to the innermost open call that owns the cell.
      if (s.index >= top.lo && s.index <= top.hi) top.writeAt.push(k);
    } else if (s.type === 'markPivot') {
      top.pivotAt = k;
    } else if (s.type === 'markSorted' && top.pivotAt !== null && top.pivotPos === null) {
      // Quicksort marks the pivot's final cell right after partitioning.
      if (s.indices.length === 1) top.pivotPos = s.indices[0];
    }
  }

  while (stack.length > 0) close(stack.pop()!, steps.length - 1);

  return { root, nodes, maxDepth };
}

/**
 * State of one node at a given frame index. A frame at index `idx` is the state
 * after `steps[idx-1]`, so a node is open once its `divide` has executed
 * (`idx > openedAt`) and has returned once the last step it owns has
 * (`idx > closedAt`).
 */
export function nodeStateAt(node: TreeNode, idx: number): NodeState {
  if (idx <= node.openedAt) return 'pending';
  if (idx > node.closedAt) return 'returned';
  if (node.combineAt !== null && idx > node.combineAt) return 'combining';
  return 'active';
}

/** 0…1 progress of this node's own merge, or null when it is not merging. */
export function combineProgress(node: TreeNode, idx: number): number | null {
  if (node.combineAt === null || idx <= node.combineAt) return null;
  const size = node.hi - node.lo + 1;
  if (size <= 0) return null;
  let done = 0;
  for (const w of node.writeAt) {
    if (w < idx) done++;
    else break;
  }
  return Math.min(1, done / size);
}

/** The innermost call that is currently executing, or null. */
export function activeNode(model: TreeModel, idx: number): TreeNode | null {
  let best: TreeNode | null = null;
  for (const n of model.nodes) {
    if (idx > n.openedAt && idx <= n.closedAt) {
      if (best === null || n.depth > best.depth) best = n;
    }
  }
  return best;
}

/** Root → active node, for the call-stack rail. */
export function callPath(model: TreeModel, idx: number): TreeNode[] {
  const target = activeNode(model, idx);
  if (!target) return [];
  const path: TreeNode[] = [];
  let cur: TreeNode | null = model.root;
  while (cur) {
    path.push(cur);
    if (cur === target) break;
    const next: TreeNode | undefined = cur.children.find(
      (c) => target.lo >= c.lo && target.hi <= c.hi,
    );
    if (!next) break;
    cur = next;
  }
  return path;
}

/* ------------------------------------------------------------------ */
/* Layout — a real tree layout, not an array-range projection.         */
/* ------------------------------------------------------------------ */

export interface LaidOutNode {
  node: TreeNode;
  /** Centre x in layout units (1 unit = one leaf slot). */
  x: number;
  depth: number;
}

export interface TreeLayout {
  placed: LaidOutNode[];
  /** Total width in leaf slots. */
  width: number;
  depth: number;
}

/**
 * Children are centred beneath their parent and siblings are spaced by subtree
 * width. The old view placed nodes at their `lo` proportion, so a lopsided
 * quicksort partition produced edges that crossed and overlapped their parent.
 */
export function layoutTree(root: TreeNode | null): TreeLayout {
  const placed: LaidOutNode[] = [];
  if (!root) return { placed, width: 0, depth: 0 };
  let cursor = 0;
  let depth = 0;

  const walk = (node: TreeNode): number => {
    if (node.depth > depth) depth = node.depth;
    if (node.children.length === 0) {
      const x = cursor;
      cursor += 1;
      placed.push({ node, x, depth: node.depth });
      return x;
    }
    const xs = node.children.map(walk);
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    placed.push({ node, x, depth: node.depth });
    return x;
  };

  walk(root);
  return { placed, width: Math.max(1, cursor), depth };
}
