import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from './registry';
import { buildSteps } from './player';
import { generateArray } from '../data/presets';
import {
  activeNode,
  buildTreeModel,
  callPath,
  combineProgress,
  layoutTree,
  nodeStateAt,
  type TreeNode,
} from './treeProgress';

/**
 * The Structure view rests entirely on this model, and its claims are structural
 * rather than numeric — which makes them easy to get subtly wrong and hard to
 * spot by eye. The regression that matters most is B1: merge nodes used to stay
 * "combining" for the whole run and then flip green together on the last step.
 */

const gen = (key: string) => ALGORITHMS.find((a) => a.key === key)!.generator;

const shapes: { name: string; data: number[] }[] = [
  { name: 'single', data: [42] },
  { name: 'two-reversed', data: [2, 1] },
  { name: 'all-equal', data: [7, 7, 7, 7, 7] },
  { name: 'small-random', data: [5, 3, 8, 1, 9, 2, 7, 4, 6] },
  { name: 'duplicates', data: [3, 1, 3, 2, 1, 2, 3, 1] },
  { name: 'random-17', data: generateArray(17, 'random') },
  { name: 'reversed-32', data: generateArray(32, 'reversed') },
  { name: 'few-unique-32', data: generateArray(32, 'few-unique') },
];

const walk = (n: TreeNode, fn: (x: TreeNode) => void) => {
  fn(n);
  for (const c of n.children) walk(c, fn);
};

describe.each(['merge', 'quick'])('tree model — %s', (key) => {
  for (const shape of shapes) {
    describe(shape.name, () => {
      const steps = buildSteps(gen(key), shape.data);
      const model = buildTreeModel(steps);

      it('has one node per divide step', () => {
        const divides = steps.filter((s) => s.type === 'divide').length;
        expect(model.nodes.length).toBe(divides);
      });

      it('nests children inside parents, in both range and step span', () => {
        if (!model.root) return;
        walk(model.root, (node) => {
          for (const c of node.children) {
            expect(c.lo).toBeGreaterThanOrEqual(node.lo);
            expect(c.hi).toBeLessThanOrEqual(node.hi);
            expect(c.openedAt).toBeGreaterThan(node.openedAt);
            expect(c.closedAt).toBeLessThanOrEqual(node.closedAt);
            expect(c.depth).toBe(node.depth + 1);
          }
          // Siblings own disjoint, ordered step spans.
          for (let i = 1; i < node.children.length; i++) {
            expect(node.children[i].openedAt).toBeGreaterThan(node.children[i - 1].closedAt);
          }
        });
      });

      it('never leaves a node open past its parent', () => {
        for (const n of model.nodes) {
          expect(n.closedAt).toBeGreaterThanOrEqual(n.openedAt);
          expect(n.closedAt).toBeLessThan(steps.length);
        }
      });

      it('reports pending before opening and returned after closing', () => {
        for (const n of model.nodes) {
          expect(nodeStateAt(n, n.openedAt)).toBe('pending');
          expect(nodeStateAt(n, n.openedAt + 1)).not.toBe('pending');
          expect(nodeStateAt(n, n.closedAt + 1)).toBe('returned');
        }
      });

      it('every node has returned by the end of the run', () => {
        const end = steps.length;
        for (const n of model.nodes) expect(nodeStateAt(n, end)).toBe('returned');
      });

      it('the active node is the innermost open call and the path reaches it', () => {
        for (let idx = 1; idx <= steps.length; idx++) {
          const a = activeNode(model, idx);
          if (!a) continue;
          const path = callPath(model, idx);
          expect(path[path.length - 1]).toBe(a);
          expect(path[0]).toBe(model.root);
          // No open call is deeper than the one reported active.
          for (const n of model.nodes) {
            if (idx > n.openedAt && idx <= n.closedAt) {
              expect(n.depth).toBeLessThanOrEqual(a.depth);
            }
          }
        }
      });
    });
  }
});

describe('B1 regression — merge nodes complete progressively', () => {
  it('does not flip the whole tree green on the final step', () => {
    const data = generateArray(32, 'random');
    const steps = buildSteps(gen('merge'), data);
    const model = buildTreeModel(steps);

    // The step index at which each node first reads as returned.
    const returnPoints = model.nodes.map((n) => n.closedAt + 1);
    const distinct = new Set(returnPoints);

    // The old behaviour produced a single shared completion point at the very
    // end. A healthy tree completes across many different steps.
    expect(distinct.size).toBeGreaterThan(model.nodes.length / 2);

    const finalStep = steps.length;
    const completingAtEnd = returnPoints.filter((p) => p >= finalStep).length;
    expect(completingAtEnd).toBeLessThanOrEqual(1); // only the root may finish last

    // And the count genuinely grows as the run proceeds.
    const returnedAt = (idx: number) =>
      model.nodes.filter((n) => nodeStateAt(n, idx) === 'returned').length;
    const quarter = returnedAt(Math.floor(finalStep * 0.25));
    const half = returnedAt(Math.floor(finalStep * 0.5));
    const threeQuarter = returnedAt(Math.floor(finalStep * 0.75));
    expect(quarter).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(quarter);
    expect(threeQuarter).toBeGreaterThan(half);
  });

  it('combine progress runs 0→1 across a merge and is monotonic', () => {
    const data = generateArray(16, 'random');
    const steps = buildSteps(gen('merge'), data);
    const model = buildTreeModel(steps);
    const merging = model.nodes.filter((n) => n.combineAt !== null);
    expect(merging.length).toBeGreaterThan(0);

    for (const n of merging) {
      let prev = -1;
      for (let idx = n.combineAt! + 1; idx <= n.closedAt + 1; idx++) {
        const p = combineProgress(n, idx);
        expect(p).not.toBeNull();
        expect(p!).toBeGreaterThanOrEqual(prev);
        expect(p!).toBeLessThanOrEqual(1);
        prev = p!;
      }
      // A completed merge has written every cell of its range.
      expect(combineProgress(n, n.closedAt + 1)).toBe(1);
    }
  });

  it('quicksort nodes carry the pivot position they actually settled', () => {
    const data = generateArray(24, 'random');
    const steps = buildSteps(gen('quick'), data);
    const model = buildTreeModel(steps);
    const withPivot = model.nodes.filter((n) => n.pivotPos !== null);
    expect(withPivot.length).toBeGreaterThan(0);
    for (const n of withPivot) {
      expect(n.pivotPos!).toBeGreaterThanOrEqual(n.lo);
      expect(n.pivotPos!).toBeLessThanOrEqual(n.hi);
      expect(n.pivotAt).not.toBeNull();
      expect(n.pivotAt!).toBeGreaterThan(n.openedAt);
      expect(n.pivotAt!).toBeLessThanOrEqual(n.closedAt);
    }
  });
});

describe('layout', () => {
  it('centres parents over their children and never collides at a depth', () => {
    for (const key of ['merge', 'quick']) {
      const steps = buildSteps(gen(key), generateArray(17, 'random'));
      const { root } = buildTreeModel(steps);
      const { placed, width } = layoutTree(root);
      expect(width).toBeGreaterThan(0);

      const xById = new Map(placed.map((p) => [p.node.id, p.x]));
      for (const { node } of placed) {
        if (node.children.length === 0) continue;
        const kids = node.children.map((c) => xById.get(c.id)!).filter((x) => x !== undefined);
        if (kids.length === 0) continue;
        const mid = (Math.min(...kids) + Math.max(...kids)) / 2;
        expect(xById.get(node.id)!).toBeCloseTo(mid, 6);
      }

      // Distinct x per node within a depth — the old range-projection layout
      // stacked lopsided partitions on top of each other.
      const byDepth = new Map<number, number[]>();
      for (const p of placed) {
        const list = byDepth.get(p.depth) ?? [];
        list.push(p.x);
        byDepth.set(p.depth, list);
      }
      for (const [, xs] of byDepth) {
        expect(new Set(xs).size).toBe(xs.length);
      }
    }
  });

  it('returns an empty layout for an empty tree', () => {
    expect(layoutTree(null)).toEqual({ placed: [], width: 0, depth: 0 });
  });
});

describe('non-recursive algorithms produce no tree', () => {
  for (const key of ['bubble', 'insertion', 'selection', 'heap']) {
    it(`${key} emits no divide steps`, () => {
      const steps = buildSteps(gen(key), generateArray(12, 'random'));
      const model = buildTreeModel(steps);
      expect(model.root).toBeNull();
      expect(model.nodes).toEqual([]);
    });
  }
});
