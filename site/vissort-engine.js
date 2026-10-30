// Plain-JS port of VisSort's step engine (src/engine/*, src/data/presets.ts, shelf.ts).
(function () {
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  function* bubble(input) {
    const a = input.slice(), n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      const phase = `Pass ${i + 1}`;
      const P = { pass: { index: i + 1, total: n - 1 }, window: { lo: 0, hi: n - 1 - i } };
      for (let j = 0; j < n - 1 - i; j++) {
        yield { type: 'compare', i: j, j: j + 1, line: 4, ctx: { phase, ...P, values: { a: a[j], b: a[j + 1] } } };
        if (a[j] > a[j + 1]) {
          yield { type: 'swap', i: j, j: j + 1, line: 5, ctx: { phase, ...P } };
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
        }
      }
      yield { type: 'markSorted', indices: [n - 1 - i], line: 6, ctx: { phase, ...P } };
      if (!swapped) break;
    }
  }

  function* insertion(input) {
    const a = input.slice(), n = a.length;
    for (let i = 1; i < n; i++) {
      let j = i;
      const phase = `Pass ${i}`;
      const P = { pass: { index: i, total: n - 1 }, window: { lo: 0, hi: i } };
      while (j > 0) {
        yield { type: 'compare', i: j - 1, j, line: 3, ctx: { phase, ...P, values: { a: a[j - 1], b: a[j] } } };
        if (a[j - 1] > a[j]) {
          yield { type: 'swap', i: j - 1, j, line: 4, ctx: { phase, ...P } };
          [a[j - 1], a[j]] = [a[j], a[j - 1]];
          j--;
        } else break;
      }
    }
    yield { type: 'markSorted', indices: range(n), line: 1, ctx: { phase: 'Sorted' } };
  }

  function* selection(input) {
    const a = input.slice(), n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      const phase = `Pass ${i + 1}`;
      const P = { pass: { index: i + 1, total: n - 1 }, window: { lo: i, hi: n - 1 } };
      for (let j = i + 1; j < n; j++) {
        yield { type: 'compare', i: min, j, line: 4, ctx: { phase, ...P, values: { a: a[min], b: a[j] } } };
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) {
        yield { type: 'swap', i, j: min, line: 5, ctx: { phase, ...P } };
        [a[i], a[min]] = [a[min], a[i]];
      }
      yield { type: 'markSorted', indices: [i], line: 5, ctx: { phase, ...P } };
    }
    if (n > 0) yield { type: 'markSorted', indices: [n - 1], line: 5, ctx: { phase: 'Sorted' } };
  }

  function* merge(input) {
    const a = input.slice(), n = a.length;
    function* ms(lo, hi) {
      yield { type: 'divide', lo, hi, line: 0, ctx: { phase: `Split ${lo}–${hi}` } };
      if (hi - lo < 1) return;
      const mid = (lo + hi) >> 1;
      yield* ms(lo, mid);
      yield* ms(mid + 1, hi);
      const phase = `Merge ${lo}–${hi}`;
      yield { type: 'combine', lo, hi, line: 5, ctx: { phase, merge: { lo, mid, hi, write: lo } } };
      const left = a.slice(lo, mid + 1), right = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      const after = () => ({ phase, merge: { lo, mid, hi, write: k + 1 } });
      while (i < left.length && j < right.length) {
        yield { type: 'compare', i: lo + i, j: mid + 1 + j, line: 6, ctx: { phase, values: { a: left[i], b: right[j] }, merge: { lo, mid, hi, write: k } } };
        if (left[i] <= right[j]) { yield { type: 'overwrite', index: k, value: left[i], line: 7, ctx: after() }; a[k] = left[i]; i++; }
        else { yield { type: 'overwrite', index: k, value: right[j], line: 7, ctx: after() }; a[k] = right[j]; j++; }
        k++;
      }
      while (i < left.length) { yield { type: 'overwrite', index: k, value: left[i], line: 7, ctx: after() }; a[k] = left[i]; i++; k++; }
      while (j < right.length) { yield { type: 'overwrite', index: k, value: right[j], line: 7, ctx: after() }; a[k] = right[j]; j++; k++; }
    }
    yield* ms(0, n - 1);
    yield { type: 'markSorted', indices: range(n), line: 5, ctx: { phase: 'Sorted' } };
  }

  function* quick(input) {
    const a = input.slice(), n = a.length;
    function* qs(lo, hi) {
      if (lo > hi) return;
      const phase = `Partition ${lo}–${hi}`;
      yield { type: 'divide', lo, hi, line: 0, ctx: { phase } };
      if (lo === hi) { yield { type: 'markSorted', indices: [lo], line: 1, ctx: { phase } }; return; }
      const pivot = a[hi];
      yield { type: 'markPivot', index: hi, line: 2, ctx: { phase } };
      let i = lo;
      for (let j = lo; j < hi; j++) {
        yield { type: 'compare', i: j, j: hi, line: 5, ctx: { phase, values: { a: a[j], b: pivot } } };
        if (a[j] < pivot) {
          if (i !== j) { yield { type: 'swap', i, j, line: 5, ctx: { phase } }; [a[i], a[j]] = [a[j], a[i]]; }
          i++;
        }
      }
      if (i !== hi) { yield { type: 'swap', i, j: hi, line: 6, ctx: { phase } }; [a[i], a[hi]] = [a[hi], a[i]]; }
      yield { type: 'markSorted', indices: [i], line: 6, ctx: { phase } };
      yield* qs(lo, i - 1);
      yield* qs(i + 1, hi);
    }
    yield* qs(0, n - 1);
    yield { type: 'markSorted', indices: range(n), line: 7, ctx: { phase: 'Sorted' } };
  }

  function* heap(input) {
    const a = input.slice(), n = a.length;
    function* sift(lo, hi, phase) {
      let root = lo;
      for (;;) {
        let child = 2 * root + 1;
        if (child >= hi) break;
        if (child + 1 < hi) {
          yield { type: 'compare', i: child, j: child + 1, line: 5, ctx: { phase, heap: hi, cursors: { root, child }, values: { a: a[child], b: a[child + 1] } } };
          if (a[child + 1] > a[child]) child++;
        }
        yield { type: 'compare', i: root, j: child, line: 5, ctx: { phase, heap: hi, cursors: { root, child }, values: { a: a[root], b: a[child] } } };
        if (a[root] < a[child]) { yield { type: 'swap', i: root, j: child, line: 5, ctx: { phase, heap: hi, cursors: { root, child } } }; [a[root], a[child]] = [a[child], a[root]]; root = child; }
        else break;
      }
    }
    for (let i = (n >> 1) - 1; i >= 0; i--) yield* sift(i, n, 'Build max-heap');
    for (let end = n - 1; end > 0; end--) {
      const phase = `Extract ${n - end} of ${n}`;
      yield { type: 'swap', i: 0, j: end, line: 3, ctx: { phase, heap: end, cursors: { end } } };
      [a[0], a[end]] = [a[end], a[0]];
      yield { type: 'markSorted', indices: [end], line: 3, ctx: { phase, heap: end } };
      yield* sift(0, end, phase);
    }
    if (n > 0) yield { type: 'markSorted', indices: [0], line: 3, ctx: { phase: 'Sorted', heap: 0 } };
  }

  const ALGORITHMS = [
    { key: 'bubble', name: 'Bubble Sort', short: 'Bubble', gen: bubble, writesModel: 'swap', stable: true,
      complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
      states: ['default', 'comparing', 'swapping', 'sorted'],
      blurb: 'Compares neighbours and swaps them until the largest value bubbles to the end.',
      description: 'Repeatedly steps through the list, comparing adjacent items and swapping them when out of order. After each pass the largest remaining value has “bubbled” to its final place. Simple and stable, but quadratic — best used only to teach the idea of sorting.' },
    { key: 'insertion', name: 'Insertion Sort', short: 'Insertion', gen: insertion, writesModel: 'swap', stable: true,
      complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
      states: ['default', 'comparing', 'swapping', 'sorted'],
      blurb: 'Slides each new value left past larger neighbours into a growing sorted prefix.',
      description: 'Builds the sorted array one element at a time, taking each new value and sliding it back past larger neighbours until it sits in the right spot. Excellent on small or nearly-sorted data, where it approaches linear time.' },
    { key: 'selection', name: 'Selection Sort', short: 'Selection', gen: selection, writesModel: 'swap', stable: false,
      complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
      states: ['default', 'comparing', 'swapping', 'sorted'],
      blurb: 'Finds the smallest remaining value and swaps it into the next slot.',
      description: 'Scans the unsorted region for its smallest value and swaps it into the next sorted slot. It always does the same number of comparisons regardless of input, but performs at most n−1 swaps — handy when writes are expensive.' },
    { key: 'merge', name: 'Merge Sort', short: 'Merge', gen: merge, writesModel: 'overwrite', stable: true,
      complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
      states: ['default', 'comparing', 'overwriting', 'sorted'],
      blurb: 'Splits the array in half, sorts each half, then merges them back together.',
      description: 'A divide-and-conquer sort: recursively split the array in half, sort each half, then merge the two sorted halves back together. Guarantees O(n log n) in every case and is stable, at the cost of O(n) extra memory.' },
    { key: 'quick', name: 'Quicksort', short: 'Quick', gen: quick, writesModel: 'swap', stable: false,
      complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
      states: ['default', 'comparing', 'swapping', 'pivot', 'sorted'],
      blurb: 'Partitions around a pivot so smaller values go left, then recurses on each side.',
      description: 'Picks a pivot (here, the last element), partitions the array so smaller values sit left of it and larger values right, then recurses on each side. Very fast in practice with excellent cache behaviour, though a bad pivot streak degrades it to O(n²).' },
    { key: 'heap', name: 'Heapsort', short: 'Heap', gen: heap, writesModel: 'swap', stable: false,
      complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
      states: ['default', 'comparing', 'swapping', 'sorted'],
      blurb: 'Builds a max-heap, then repeatedly moves the largest value to the back.',
      description: 'Turns the array into a binary max-heap, then repeatedly swaps the largest element to the end and restores the heap over the shrinking front. O(n log n) worst-case with no extra memory, though its scattered access pattern makes it slower than quicksort in practice.' },
  ];

  const L = (indent, text) => ({ indent, text });
  const PSEUDOCODE = {
    bubble: [L(0, 'procedure bubbleSort(A):'), L(1, 'repeat'), L(2, 'swapped ← false'), L(2, 'for i ← 0 to n − 2:'), L(3, 'if A[i] > A[i+1]:'), L(3, '    swap A[i], A[i+1];  swapped ← true'), L(1, 'until swapped = false')],
    insertion: [L(0, 'procedure insertionSort(A):'), L(1, 'for i ← 1 to n − 1:'), L(2, 'j ← i'), L(2, 'while j > 0 and A[j−1] > A[j]:'), L(3, 'swap A[j−1], A[j]'), L(3, 'j ← j − 1')],
    selection: [L(0, 'procedure selectionSort(A):'), L(1, 'for i ← 0 to n − 2:'), L(2, 'min ← i'), L(2, 'for j ← i+1 to n − 1:'), L(3, 'if A[j] < A[min]:  min ← j'), L(2, 'swap A[i], A[min]')],
    merge: [L(0, 'procedure mergeSort(A, lo, hi):'), L(1, 'if lo ≥ hi:  return'), L(1, 'mid ← ⌊(lo + hi) / 2⌋'), L(1, 'mergeSort(A, lo, mid)'), L(1, 'mergeSort(A, mid+1, hi)'), L(1, 'merge the two sorted halves:'), L(2, 'compare the front of each half'), L(2, 'write the smaller into place, advance')],
    quick: [L(0, 'procedure quickSort(A, lo, hi):'), L(1, 'if lo ≥ hi:  return'), L(1, 'pivot ← A[hi]'), L(1, 'i ← lo'), L(1, 'for j ← lo to hi − 1:'), L(2, 'if A[j] < pivot:  swap A[i], A[j];  i ← i+1'), L(1, 'swap A[i], A[hi]        ▹ pivot lands home'), L(1, 'quickSort(A, lo, i−1);  quickSort(A, i+1, hi)')],
    heap: [L(0, 'procedure heapSort(A):'), L(1, 'build a max-heap over A'), L(1, 'for end ← n − 1 down to 1:'), L(2, 'swap A[0], A[end]      ▹ largest to the back'), L(2, 'siftDown(A, 0, end):'), L(3, 'swap the root below its larger child'), L(3, 'repeat until the heap property holds')],
  };

  function accumulate(c, step) {
    if (step.type === 'compare') { c.comparisons++; c.accesses += 2; }
    else if (step.type === 'swap') { c.swaps++; c.writes += 2; c.accesses += 4; }
    else if (step.type === 'overwrite') { c.writes++; c.accesses++; }
  }

  class Player {
    constructor(input, steps) { this.base = input.slice(); this.steps = steps; this.n = input.length; this.reset(); }
    get total() { return this.steps.length; }
    get atEnd() { return this.idx >= this.steps.length; }
    reset() {
      this.heights = this.base.slice();
      this.posOf = this.base.map((_, i) => i);
      this.idAtPos = this.base.map((_, i) => i);
      this.sortedPos = new Array(this.n).fill(false);
      this.pivotPos = null;
      this.counters = { comparisons: 0, swaps: 0, writes: 0, accesses: 0 };
      this.idx = 0; this.clear();
    }
    clear() { this.cmpA = this.cmpB = this.swpA = this.swpB = this.ovr = -1; }
    apply(s) {
      this.clear();
      if (s.type === 'compare') { this.cmpA = s.i; this.cmpB = s.j; }
      else if (s.type === 'swap') {
        this.swpA = s.i; this.swpB = s.j;
        const a = this.idAtPos[s.i], b = this.idAtPos[s.j];
        this.idAtPos[s.i] = b; this.idAtPos[s.j] = a; this.posOf[a] = s.j; this.posOf[b] = s.i;
      } else if (s.type === 'overwrite') { this.ovr = s.index; this.heights[this.idAtPos[s.index]] = s.value; }
      else if (s.type === 'markPivot') this.pivotPos = s.index;
      else if (s.type === 'markSorted') {
        for (const p of s.indices) this.sortedPos[p] = true;
        if (this.pivotPos !== null && this.sortedPos[this.pivotPos]) this.pivotPos = null;
      }
      accumulate(this.counters, s);
    }
    forward() { if (this.idx >= this.steps.length) return false; this.apply(this.steps[this.idx]); this.idx++; return true; }
    seekTo(t) { const c = Math.max(0, Math.min(t, this.steps.length)); this.reset(); for (let k = 0; k < c; k++) this.apply(this.steps[k]); this.idx = c; }
    markAllSorted() { this.sortedPos.fill(true); this.pivotPos = null; this.clear(); }
    stateOfPos(p) {
      if (p === this.swpA || p === this.swpB) return 'swapping';
      if (p === this.cmpA || p === this.cmpB) return 'comparing';
      if (p === this.ovr) return 'overwriting';
      if (this.pivotPos === p) return 'pivot';
      if (this.sortedPos[p]) return 'sorted';
      return 'default';
    }
    frame() {
      const state = new Array(this.n);
      for (let id = 0; id < this.n; id++) state[id] = this.stateOfPos(this.posOf[id]);
      return { heights: this.heights.slice(), posOf: this.posOf.slice(), state, counters: { ...this.counters }, index: this.idx, total: this.steps.length };
    }
  }

  const buildSteps = (gen, input) => Array.from(gen(input));

  function ascending(size) {
    if (size === 1) return [100];
    return Array.from({ length: size }, (_, i) => Math.round(8 + (92 * i) / (size - 1)));
  }
  function shuffle(arr, rnd = Math.random) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  function generateArray(size, preset) {
    const n = Math.max(5, Math.min(200, Math.round(size)));
    const asc = ascending(n);
    if (preset === 'reversed') return asc.reverse();
    if (preset === 'nearly-sorted') {
      const a = asc.slice();
      const sw = Math.max(1, Math.floor(n * 0.1));
      for (let s = 0; s < sw; s++) { const i = Math.floor(Math.random() * n); const j = Math.min(n - 1, i + 1 + Math.floor(Math.random() * 2)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    if (preset === 'few-unique') {
      const vals = [0, 1, 2, 3, 4].map((b) => Math.round(8 + (92 * b) / 4));
      return shuffle(Array.from({ length: n }, () => vals[Math.floor(Math.random() * 5)]));
    }
    return shuffle(asc.slice());
  }
  function seeded(seed) { let s = seed * 2654435761 >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; }
  function previewArray(n, seed) { return shuffle(Array.from({ length: n }, (_, i) => 12 + Math.round((88 * i) / (n - 1))), seeded(seed)); }

  // Precomputes every frame of a short run — used by looping mini previews.
  function previewFrames(algo, input) {
    const p = new Player(input, buildSteps(algo.gen, input));
    const frames = [];
    const snap = () => { const f = p.frame(); const h = [], st = []; for (let id = 0; id < f.heights.length; id++) { h[f.posOf[id]] = f.heights[id]; st[f.posOf[id]] = f.state[id]; } frames.push({ h, st }); };
    snap();
    while (p.forward()) { if (p.atEnd) p.markAllSorted(); snap(); }
    return frames;
  }

  // Crane's physical shelf model (shelf.ts).
  function buildShelf(input, steps) {
    const n = input.length;
    let value = input.slice();
    const posOf = input.map((_, i) => i), idAt = input.map((_, i) => i);
    const tl = { posOf: [posOf.slice()], values: [value] };
    for (const step of steps) {
      if (step.type === 'swap') {
        const a = idAt[step.i], b = idAt[step.j];
        idAt[step.i] = b; idAt[step.j] = a; posOf[a] = step.j; posOf[b] = step.i;
      } else if (step.type === 'overwrite') {
        const k = step.index;
        let from = -1;
        for (let p = k; p < n; p++) if (value[idAt[p]] === step.value) { from = p; break; }
        if (from > k) {
          const id = idAt[from];
          for (let p = from; p > k; p--) { idAt[p] = idAt[p - 1]; posOf[idAt[p]] = p; }
          idAt[k] = id; posOf[id] = k;
        } else if (from < 0) { value = value.slice(); value[idAt[k]] = step.value; }
      }
      tl.posOf.push(posOf.slice());
      tl.values.push(value);
    }
    return tl;
  }
  const comparedSlots = (step) => (step.ctx && step.ctx.merge ? [step.ctx.merge.write, step.j] : [step.i, step.j]);

  function parseArray(text) {
    const parts = String(text).split(/[\s,;]+/).filter(Boolean);
    if (parts.length < 2) return { error: 'Enter at least two numbers.' };
    if (parts.length > 200) return { error: 'Up to 200 numbers.' };
    const nums = parts.map(Number);
    if (nums.some((v) => !Number.isFinite(v))) return { error: 'Numbers only, separated by commas or spaces.' };
    if (nums.some((v) => v < 0 || v > 999)) return { error: 'Use values from 0 to 999.' };
    return { values: nums.map((v) => Math.round(v)) };
  }


  // ---- Structure view models (treeProgress.ts + stepContext.buildPassLadder) ----
  function buildTreeModel(steps) {
    const nodes = [], stack = [];
    let root = null, maxDepth = 0;
    const contains = (nd, lo, hi) => lo >= nd.lo && hi <= nd.hi;
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k];
      if (s.type === 'divide') {
        while (stack.length && !contains(stack[stack.length - 1], s.lo, s.hi)) stack.pop().closedAt = k - 1;
        const parent = stack[stack.length - 1] || null;
        const node = { id: s.lo + '-' + s.hi + '-' + k, lo: s.lo, hi: s.hi, depth: parent ? parent.depth + 1 : 0, children: [], openedAt: k, closedAt: steps.length - 1, combineAt: null, writeAt: [], pivotPos: null, pivotAt: null };
        if (parent) parent.children.push(node); else if (!root) root = node;
        nodes.push(node); stack.push(node);
        if (node.depth > maxDepth) maxDepth = node.depth;
        continue;
      }
      if (s.type === 'combine') {
        while (stack.length) {
          const t = stack[stack.length - 1];
          if ((t.lo === s.lo && t.hi === s.hi) || !(t.lo >= s.lo && t.hi <= s.hi)) break;
          stack.pop().closedAt = k - 1;
        }
        const owner = stack[stack.length - 1];
        if (owner && owner.lo === s.lo && owner.hi === s.hi) owner.combineAt = k;
        continue;
      }
      const top = stack[stack.length - 1];
      if (!top) continue;
      if (s.type === 'overwrite' && top.combineAt !== null) { if (s.index >= top.lo && s.index <= top.hi) top.writeAt.push(k); }
      else if (s.type === 'markPivot') top.pivotAt = k;
      else if (s.type === 'markSorted' && top.pivotAt !== null && top.pivotPos === null && s.indices.length === 1) { top.pivotPos = s.indices[0]; top.pivotSortedAt = k; }
    }
    while (stack.length) stack.pop().closedAt = steps.length - 1;
    // layout: children centred beneath parent, siblings spaced by subtree width
    let cursor = 0;
    const walk = (nd) => {
      if (!nd.children.length) { nd.x = cursor++; return nd.x; }
      const xs = nd.children.map(walk);
      nd.x = (xs[0] + xs[xs.length - 1]) / 2;
      return nd.x;
    };
    if (root) walk(root);
    return { root, nodes, maxDepth, width: Math.max(1, cursor) };
  }
  function nodeStateAt(nd, idx) {
    if (idx <= nd.openedAt) return 'pending';
    if (idx > nd.closedAt) return 'returned';
    if (nd.combineAt !== null && idx > nd.combineAt) return 'combining';
    return 'active';
  }
  function combineProgress(nd, idx) {
    if (nd.combineAt === null || idx <= nd.combineAt) return null;
    let done = 0;
    for (const w of nd.writeAt) { if (w < idx) done++; else break; }
    return Math.min(1, done / (nd.hi - nd.lo + 1));
  }
  function activeNode(model, idx) {
    let best = null;
    for (const nd of model.nodes) if (idx > nd.openedAt && idx <= nd.closedAt && (!best || nd.depth > best.depth)) best = nd;
    return best;
  }
  function callPath(model, idx) {
    const target = activeNode(model, idx);
    if (!target) return [];
    const path = [];
    let cur = model.root;
    while (cur) {
      path.push(cur);
      if (cur === target) break;
      cur = cur.children.find((c) => target.lo >= c.lo && target.hi <= c.hi);
    }
    return path;
  }
  function buildPassLadder(steps) {
    const rows = [];
    let cur = null;
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k], pass = s.ctx && s.ctx.pass;
      if (!pass) continue;
      if (!cur || cur.index !== pass.index) {
        cur = { index: pass.index, total: pass.total, from: k, to: k, comparisons: 0, swaps: 0, window: s.ctx.window ? { ...s.ctx.window } : null };
        rows.push(cur);
      }
      cur.to = k;
      if (s.type === 'compare') cur.comparisons++;
      else if (s.type === 'swap') cur.swaps++;
    }
    return rows;
  }
  const structureOf = (key) => (key === 'merge' || key === 'quick' ? 'recursion' : key === 'heap' ? 'heap' : 'passes');

  window.VSEngine = { ALGORITHMS, PSEUDOCODE, Player, buildSteps, generateArray, previewArray, previewFrames, buildShelf, comparedSlots, parseArray, buildTreeModel, nodeStateAt, combineProgress, activeNode, callPath, buildPassLadder, structureOf };
})();
