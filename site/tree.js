// Structure view — recursion tree (merge, quick), binary heap (heap), pass ladder (bubble, insertion, selection).
// Built from the real emitted steps (port of TreeView / RecursionTree / HeapTree / PassLadder / ArrayRibbon).
const NS = 'http://www.w3.org/2000/svg';
const MONO = 'var(--mono)';
const MAX_DEPTH = 12;
const mixT = (pct) => `color-mix(in srgb, var(--text) ${pct}%, transparent)`;
const sv = (name) => `var(--s-${name})`;

function el(tag, css = {}, text) {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (text != null) e.textContent = text;
  return e;
}
function svg(tag, attrs = {}, css = {}) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  Object.assign(e.style, css);
  return e;
}
const set = (e, k, v) => { if (e.__c === undefined) e.__c = {}; if (e.__c[k] !== v) { e.__c[k] = v; if (k.startsWith('s:')) e.style[k.slice(2)] = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v); } };

export function createTree(host, E) {
  const root = el('div', { position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', gap: '14px', padding: '0 28px', fontFamily: 'var(--font)' });
  host.appendChild(root);

  const head = el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minHeight: '26px' });
  const headL = el('div', { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', minWidth: '0' });
  const headR = el('div', { flex: 'none', fontFamily: MONO, fontSize: '12px', color: 'var(--text-3)' });
  head.append(headL, headR);

  const ribbonWrap = el('div', { flex: 'none' });
  const ribbon = el('div', { position: 'relative', display: 'flex', alignItems: 'flex-end', height: '36px' });
  const bracketRow = el('div', { position: 'relative', height: '20px' });
  const bracket = el('div', { position: 'absolute', top: '4px', height: '6px', borderLeft: '1.5px solid var(--text-2)', borderRight: '1.5px solid var(--text-2)', borderTop: '1.5px solid var(--text-2)', borderRadius: '2px 2px 0 0', transition: 'left .25s cubic-bezier(.3,.8,.3,1), width .25s cubic-bezier(.3,.8,.3,1)' });
  const bracketLabel = el('span', { position: 'absolute', top: '9px', transform: 'translateX(-50%)', fontFamily: MONO, fontSize: '10.5px', color: 'var(--text-2)', whiteSpace: 'nowrap', transition: 'left .25s cubic-bezier(.3,.8,.3,1)' });
  bracketRow.append(bracket, bracketLabel);
  ribbonWrap.append(ribbon, bracketRow);

  const body = el('div', { position: 'relative', flex: '1', minHeight: '0', overflow: 'auto', borderRadius: '16px', scrollbarWidth: 'thin', scrollbarColor: 'var(--fill-2) transparent' });
  const foot = el('div', { flex: 'none', display: 'flex', flexDirection: 'column', gap: '8px' });
  root.append(head, ribbonWrap, body, foot);

  let cur = { steps: null, kind: null };
  let cells = [];
  let lastProps = null;

  const ro = new ResizeObserver(() => { if (lastProps) { cur.steps = null; update(lastProps); } });
  ro.observe(body);

  function chip(text, strong) {
    return el('span', { padding: '3px 9px', borderRadius: '999px', fontFamily: MONO, fontSize: '11.5px', background: strong ? 'var(--text)' : 'var(--fill)', color: strong ? 'var(--surface)' : 'var(--text-2)' }, text);
  }
  function sep() { return el('span', { fontSize: '11px', color: 'var(--text-3)' }, '›'); }

  // ---------- ribbon ----------
  function buildRibbon(n) {
    ribbon.textContent = '';
    ribbon.style.gap = n <= 40 ? '3px' : n <= 100 ? '1px' : '0px';
    cells = Array.from({ length: n }, () => {
      const c = el('span', { flex: '1', minWidth: '0', borderRadius: n <= 60 ? '3px' : '1px', transition: 'height .18s ease, background-color .15s linear, opacity .2s ease' });
      ribbon.appendChild(c);
      return c;
    });
  }
  function paintRibbon(vals, states, max, range, label, snap) {
    const n = vals.length;
    for (let p = 0; p < n; p++) {
      const c = cells[p];
      set(c, 's:height', Math.max(14, (vals[p] / max) * 100) + '%');
      set(c, 's:background', sv(states[p]));
      set(c, 's:opacity', range && (p < range.lo || p > range.hi) && states[p] !== 'sorted' ? '0.22' : '1');
      set(c, 's:transition', snap ? 'none' : 'height .18s ease, background-color .15s linear, opacity .2s ease');
    }
    if (range) {
      bracket.style.display = bracketLabel.style.display = '';
      bracket.style.left = (range.lo / n) * 100 + '%';
      bracket.style.width = ((range.hi - range.lo + 1) / n) * 100 + '%';
      bracketLabel.style.left = ((range.lo + (range.hi - range.lo + 1) / 2) / n) * 100 + '%';
      bracketLabel.textContent = label;
    } else bracket.style.display = bracketLabel.style.display = 'none';
  }

  // ---------- recursion tree ----------
  // Each call is drawn as the values it holds: the full array at the root, every child under its slice.
  let R = null;
  const CELL_TR = 'fill .15s linear, stroke .15s linear';
  const calm = (s) => (s === 'sorted' ? 'sorted' : 'default');
  // A call's values move only while it does its own work (quicksort's partition, merge sort's merge);
  // outside that window it shows what it was handed, then what it handed back.
  function snapshots(model, base, steps) {
    const want = new Map();
    const need = (t, nd, key) => { if (!want.has(t)) want.set(t, []); want.get(t).push([nd, key]); };
    for (const nd of model.nodes) {
      nd.liveFrom = (nd.combineAt ?? nd.openedAt) + 1;
      nd.liveTo = (nd.pivotSortedAt ?? nd.closedAt) + 1;
      need(nd.openedAt + 1, nd, 'snapIn'); need(nd.liveTo, nd, 'snapOut');
    }
    const pl = new E.Player(base, steps);
    for (let t = 0; t <= steps.length; t++) {
      const jobs = want.get(t);
      if (jobs) {
        const f = pl.frame(), vals = [], states = [];
        for (let id = 0; id < f.heights.length; id++) { vals[f.posOf[id]] = f.heights[id]; states[f.posOf[id]] = f.state[id]; }
        for (const [nd, key] of jobs) nd[key] = { vals: vals.slice(nd.lo, nd.hi + 1), states: states.slice(nd.lo, nd.hi + 1).map(calm) };
      }
      pl.forward();
    }
  }
  function buildRecursion(model, n) {
    body.textContent = '';
    const c = n <= 8 ? 34 : n <= 12 ? 30 : n <= 16 ? 27 : n <= 24 ? 23 : n <= 32 ? 20 : n <= 48 ? 12 : n <= 100 ? 8 : 6;
    // past 32 values the numbers stop fitting, so each cell becomes a bar
    const text = c >= 18;
    const ig = text ? 2 : c >= 8 ? 1 : 0, bp = text ? 3 : 1.5, cellW = c - ig, cellH = text ? c - ig : 22, nodeH = cellH + bp * 2;
    const fs = c >= 30 ? 12.5 : c >= 26 ? 11.5 : c >= 22 ? 10.5 : 9;
    const depth = Math.min(model.maxDepth, MAX_DEPTH), pad = 18;
    // a gap opens wherever a call hands its slices to its children; the higher the split, the wider
    const gapAt = new Array(n + 1).fill(0), gMin = Math.max(2, c * 0.3);
    for (const nd of model.nodes) {
      if (nd.depth >= MAX_DEPTH) continue;
      const g = Math.max(gMin, c * 0.9 * Math.pow(0.72, nd.depth));
      for (const ch of nd.children) {
        if (ch.lo > nd.lo) gapAt[ch.lo] = g;
        if (ch.hi < nd.hi) gapAt[ch.hi + 1] = g;
      }
    }
    const X = new Array(n);
    for (let p = 0, x = 0; p < n; p++) { x += gapAt[p]; X[p] = x; x += c; }
    const spanW = X[n - 1] + c;
    const bh0 = Math.max(160, body.clientHeight);
    // deep trees squeeze their level spacing before anything shrinks
    const level = nodeH + Math.max(24, Math.min(46, (bh0 - pad * 2 - (depth + 1) * nodeH) / Math.max(1, depth)));
    const natW = spanW + pad * 2, natH = depth * level + nodeH + pad * 2;
    const bw = Math.max(200, body.clientWidth), bh = Math.max(160, body.clientHeight);
    const fitBoth = Math.min(bw / natW, bh / natH);
    const scale = fitBoth >= 0.8 ? Math.min(1.15, fitBoth) : Math.max(0.7, Math.min(1.15, bw / natW));
    const svgEl = svg('svg', { viewBox: `0 0 ${natW} ${natH}`, width: natW * scale, height: natH * scale }, { display: 'block', margin: '0 auto', overflow: 'visible' });
    const gEdges = svg('g'), gNodes = svg('g');
    svgEl.append(gEdges, gNodes);
    body.appendChild(svgEl);
    const cx = (nd) => pad + (X[nd.lo] + X[nd.hi] + c) / 2;
    const top = (nd) => pad + nd.depth * level;
    const boxW = (nd) => (nd.hi - nd.lo + 1) * c - ig + bp * 2;
    const visible = model.nodes.filter((nd) => nd.depth <= MAX_DEPTH);
    const edges = [];
    for (const nd of visible) for (const ch of nd.children) {
      if (ch.depth > MAX_DEPTH) continue;
      // leave from the middle of the slice this child is handed
      const left = cx(nd) - boxW(nd) / 2 + bp;
      const x1 = left + ((ch.lo - nd.lo) * c + (ch.hi - nd.lo) * c + cellW) / 2;
      const y1 = top(nd) + nodeH, x2 = cx(ch), y2 = top(ch), my = (y1 + y2) / 2;
      const p = svg('path', { d: `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`, fill: 'none' }, { transition: 'stroke .2s ease, stroke-width .2s ease' });
      gEdges.appendChild(p);
      edges.push({ p, parent: nd, child: ch });
    }
    const nodes = visible.map((nd) => {
      const w = boxW(nd);
      const g = svg('g', { transform: `translate(${cx(nd) - w / 2} ${top(nd)})` }, { transition: 'opacity .25s ease' });
      const halo = svg('rect', { x: -4, y: -4, width: w + 8, height: nodeH + 8, rx: 11 }, { fill: 'none', stroke: 'var(--text)', strokeWidth: '1', opacity: '0', transition: 'opacity .2s ease' });
      const box = svg('rect', { x: 0, y: 0, width: w, height: nodeH, rx: text ? 7 : 3 }, { fill: 'var(--surface)', transition: 'stroke .2s ease' });
      g.append(halo, box);
      const cells = [];
      for (let p = nd.lo; p <= nd.hi; p++) {
        const x = bp + (p - nd.lo) * c;
        const r = svg('rect', { x, y: bp, width: cellW, height: cellH, rx: text ? 5 : 1 }, { strokeWidth: '1.3', transition: CELL_TR });
        g.appendChild(r);
        let t = null;
        if (text) {
          t = svg('text', { x: x + cellW / 2, y: bp + cellH / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, { fontFamily: MONO, fontSize: fs + 'px', fontWeight: '600', fill: 'var(--text)' });
          g.appendChild(t);
        }
        cells.push({ r, t });
      }
      let badge = null, badgeText = null;
      if (text && nd.pivotAt !== null) {
        badge = svg('rect', { x: w - 16, y: -10, width: 30, height: 16, rx: 8 }, { fill: sv('pivot') });
        badgeText = svg('text', { x: w - 1, y: -2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, { fontFamily: MONO, fontSize: '9.5px', fontWeight: '600', fill: '#fff' });
        g.append(badge, badgeText);
      }
      gNodes.appendChild(g);
      return { nd, g, halo, box, cells, badge, badgeText };
    });
    R = { svgEl, edges, nodes, clipped: model.nodes.length - visible.length, scale, cx, cy: (nd) => top(nd) + nodeH / 2, text, bp, cellH };
  }
  function paintCell(cell, v, s, max, snap) {
    const blank = v === null;
    set(cell.r, 's:transition', snap ? 'none' : CELL_TR);
    if (!R.text) {
      const h = blank ? 0 : Math.max(2, (v / max) * R.cellH);
      set(cell.r, 'height', String(h)); set(cell.r, 'y', String(R.bp + R.cellH - h));
      set(cell.r, 's:fill', sv(s));
      return;
    }
    set(cell.r, 's:fill', blank ? 'var(--fill)' : `color-mix(in srgb, ${sv(s)} ${s === 'default' ? 30 : 32}%, var(--surface))`);
    set(cell.r, 's:stroke', blank || s === 'default' || s === 'sorted' ? 'transparent' : sv(s));
    set(cell.t, 'text', blank ? '' : String(Math.round(v)));
  }
  function paintRecursion(model, idx, vals, states, max, snap) {
    const active = E.activeNode(model, idx);
    const path = new Set(E.callPath(model, idx).map((n) => n.id));
    for (const e of R.edges) {
      const open = idx > e.child.openedAt;
      const hot = path.has(e.parent.id) && path.has(e.child.id);
      set(e.p, 's:stroke', hot ? 'var(--text)' : open ? mixT(28) : mixT(12));
      set(e.p, 's:strokeWidth', hot ? '1.8' : '1.2');
      set(e.p, 's:strokeDasharray', open ? 'none' : '3 4');
    }
    for (const n of R.nodes) {
      const nd = n.nd, st = E.nodeStateAt(nd, idx);
      const isActive = active && nd.id === active.id;
      let stroke = mixT(16), dash = '3 3', sw = '1';
      if (st === 'returned') { stroke = `color-mix(in srgb, ${sv('sorted')} 50%, transparent)`; dash = 'none'; }
      else if (st !== 'pending') { stroke = isActive ? 'var(--text)' : path.has(nd.id) ? mixT(50) : mixT(28); dash = 'none'; sw = isActive ? '1.6' : '1.1'; }
      set(n.box, 's:stroke', stroke); set(n.box, 's:strokeDasharray', dash); set(n.box, 's:strokeWidth', sw);
      set(n.halo, 's:opacity', isActive ? '0.16' : '0');
      set(n.g, 's:opacity', st === 'pending' ? '0.55' : '1');
      const live = idx >= nd.liveFrom && idx <= nd.liveTo;
      const shot = idx < nd.liveFrom ? nd.snapIn : nd.snapOut;
      n.cells.forEach((cell, i) => {
        const p = nd.lo + i;
        if (st === 'pending') paintCell(cell, null, 'default', max, snap);
        else if (live) paintCell(cell, vals[p], states[p], max, snap);
        else paintCell(cell, shot.vals[i], shot.states[i], max, snap);
      });
      if (n.badge) {
        const shown = idx > nd.pivotAt;
        const pos = nd.pivotSortedAt != null && idx >= nd.pivotSortedAt ? nd.pivotPos : nd.hi;
        set(n.badge, 's:opacity', shown ? '1' : '0'); set(n.badgeText, 's:opacity', shown ? '1' : '0');
        set(n.badgeText, 'text', String(Math.round(vals[pos])));
      }
    }
    // keep the active node in view when the tree scrolls
    if (active && body.scrollWidth > body.clientWidth + 4) {
      const x = R.cx(active) * R.scale;
      if (x < body.scrollLeft + 60 || x > body.scrollLeft + body.clientWidth - 60) body.scrollLeft = x - body.clientWidth / 2;
    }
    if (active && body.scrollHeight > body.clientHeight + 4) {
      const y = R.cy(active) * R.scale;
      if (y < body.scrollTop + 50 || y > body.scrollTop + body.clientHeight - 50) body.scrollTop = y - body.clientHeight / 2;
    }
    return active;
  }

  // ---------- heap ----------
  let H = null;
  function buildHeap(n) {
    body.textContent = '';
    const r = n <= 15 ? 18 : n <= 31 ? 15 : 12, level = n <= 31 ? 66 : 54, pad = 26;
    const depth = Math.floor(Math.log2(n));
    const natW = Math.max(320, Math.pow(2, depth) * (2 * r + 8)) + pad * 2;
    const natH = depth * level + 2 * r + pad * 2 + 10;
    const bw = Math.max(200, body.clientWidth), bh = Math.max(160, body.clientHeight);
    const scale = Math.max(0.42, Math.min(1.2, bw / natW, bh / natH));
    const svgEl = svg('svg', { viewBox: `0 0 ${natW} ${natH}`, width: natW * scale, height: natH * scale }, { display: 'block', margin: '0 auto', overflow: 'visible' });
    const gE = svg('g'), gN = svg('g');
    svgEl.append(gE, gN);
    body.appendChild(svgEl);
    const at = (i) => {
      const d = Math.floor(Math.log2(i + 1)), k = i - (Math.pow(2, d) - 1), slots = Math.pow(2, d);
      return { x: pad + ((k + 0.5) / slots) * (natW - pad * 2), y: pad + r + d * level };
    };
    const edges = [];
    for (let i = 0; i < n; i++) for (const c of [2 * i + 1, 2 * i + 2]) {
      if (c >= n) continue;
      const a = at(i), b = at(c);
      const line = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, { transition: 'stroke .2s ease, opacity .25s ease' });
      gE.appendChild(line);
      edges.push({ line, p: i, c });
    }
    const nodes = Array.from({ length: n }, (_, i) => {
      const { x, y } = at(i);
      const g = svg('g', {}, { transition: 'opacity .25s ease' });
      const halo = svg('circle', { cx: x, cy: y, r: r + 5, fill: 'none' }, { stroke: 'var(--text)', strokeWidth: '1.5', opacity: '0', transition: 'opacity .15s ease' });
      const c = svg('circle', { cx: x, cy: y, r }, { stroke: 'var(--surface)', strokeWidth: '2', transition: 'fill .15s linear' });
      const t = svg('text', { x, y: y + 4, 'text-anchor': 'middle' }, { fontFamily: MONO, fontSize: r >= 15 ? '11.5px' : '9.5px', fontWeight: '600', fill: '#fff' });
      const ix = svg('text', { x, y: y + r + 12, 'text-anchor': 'middle' }, { fontFamily: MONO, fontSize: '9px', fill: 'var(--text-3)' });
      ix.textContent = i;
      g.append(halo, c, t, ix);
      gN.appendChild(g);
      return { g, halo, c, t };
    });
    H = { edges, nodes };
  }
  function paintHeap(heapSize, cursors, vals, states, snap) {
    const hot = new Set();
    if (cursors && cursors.root != null) hot.add(cursors.root);
    if (cursors && cursors.child != null) hot.add(cursors.child);
    for (const e of H.edges) {
      const live = e.c < heapSize;
      const h = hot.has(e.p) && hot.has(e.c);
      set(e.line, 's:stroke', h ? 'var(--text)' : mixT(20));
      set(e.line, 's:strokeWidth', h ? '2' : '1.2');
      set(e.line, 's:opacity', live ? '1' : '0');
    }
    H.nodes.forEach((nd, i) => {
      const live = i < heapSize;
      set(nd.g, 's:opacity', live ? '1' : '0');
      set(nd.c, 's:fill', sv(states[i]));
      if (snap) set(nd.c, 's:transition', 'none');
      set(nd.t, 'text', String(Math.round(vals[i])));
      set(nd.halo, 's:opacity', live && hot.has(i) ? '0.5' : '0');
    });
  }

  // ---------- pass ladder ----------
  let P = null;
  function buildPasses(rows, n) {
    body.textContent = '';
    const list = el('div', { display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '8px' });
    const maxC = rows.reduce((m, r) => Math.max(m, r.comparisons), 1);
    const items = rows.map((row) => {
      const r = el('div', { display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 120px', alignItems: 'center', gap: '14px', padding: '8px 12px', borderRadius: '12px', transition: 'background-color .2s ease, opacity .2s ease' });
      const lab = el('span', { fontFamily: MONO, fontSize: '12px', color: 'var(--text)' }, `Pass ${row.index}`);
      const tracks = el('div', { display: 'flex', flexDirection: 'column', gap: '4px' });
      const track = el('div', { position: 'relative', height: '8px', borderRadius: '4px', background: 'var(--fill)', overflow: 'hidden' });
      const w = row.window || { lo: 0, hi: n - 1 };
      const left = (w.lo / n) * 100, width = ((w.hi - w.lo + 1) / n) * 100;
      const win = el('span', { position: 'absolute', top: '0', bottom: '0', left: left + '%', width: width + '%', borderRadius: '4px', transition: 'background-color .25s ease' });
      const prog = el('span', { position: 'absolute', top: '0', bottom: '0', left: left + '%', width: '0%', borderRadius: '4px', background: 'var(--text-2)' });
      track.append(win, prog);
      const cost = el('div', { height: '3px', borderRadius: '2px', width: (row.comparisons / maxC) * 100 + '%', background: `color-mix(in srgb, ${sv('comparing')} 70%, transparent)` });
      tracks.append(track, cost);
      const counts = el('span', { fontFamily: MONO, fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'right', whiteSpace: 'nowrap' }, `${row.comparisons} cmp · ${row.swaps} swp`);
      r.append(lab, tracks, counts);
      list.appendChild(r);
      return { row, r, win, prog, width };
    });
    body.appendChild(list);
    P = { items, total: rows.reduce((s, r) => s + r.comparisons, 0) };
  }
  function paintPasses(idx) {
    let activeRow = null, done = 0;
    for (const it of P.items) {
      const isActive = idx > it.row.from && idx <= it.row.to;
      const isDone = idx > it.row.to;
      if (isDone) done++;
      if (isActive) activeRow = it;
      set(it.r, 's:background', isActive ? 'var(--surface-2)' : 'transparent');
      set(it.r, 's:opacity', isActive || isDone ? '1' : '0.42');
      set(it.win, 's:background', isDone ? `color-mix(in srgb, ${sv('sorted')} 50%, transparent)` : mixT(14));
      const within = isActive ? (idx - it.row.from) / Math.max(1, it.row.to - it.row.from + 1) : 0;
      set(it.prog, 's:width', it.width * within + '%');
    }
    if (activeRow) {
      const top = activeRow.r.offsetTop, h = activeRow.r.offsetHeight;
      if (top < body.scrollTop + 8 || top + h > body.scrollTop + body.clientHeight - 8) body.scrollTop = top - body.clientHeight / 3;
    }
    return { activeRow, done };
  }

  // ---------- update ----------
  function update(p) {
    lastProps = p;
    const { steps, base, frame, kind, snap } = p;
    const n = frame.heights.length;
    const vals = new Array(n), states = new Array(n);
    let max = 1;
    for (let id = 0; id < n; id++) { vals[frame.posOf[id]] = frame.heights[id]; states[frame.posOf[id]] = frame.state[id]; if (frame.heights[id] > max) max = frame.heights[id]; }
    const idx = Math.min(frame.index, steps.length);
    const step = idx > 0 ? steps[idx - 1] : null;

    if (cur.steps !== steps || cur.kind !== kind || cells.length !== n) {
      cur = { steps, kind };
      buildRibbon(n);
      foot.textContent = '';
      body.scrollTop = body.scrollLeft = 0;
      if (kind === 'recursion') { cur.model = E.buildTreeModel(steps); snapshots(cur.model, base, steps); buildRecursion(cur.model, n); }
      else if (kind === 'heap') {
        cur.heapAt = new Array(steps.length + 1); cur.curAt = new Array(steps.length + 1);
        let h = n, c = null; cur.heapAt[0] = n; cur.curAt[0] = null;
        for (let k = 0; k < steps.length; k++) { const x = steps[k].ctx; if (x && x.heap != null) h = x.heap; c = x && x.cursors && x.cursors.root != null ? x.cursors : null; cur.heapAt[k + 1] = h; cur.curAt[k + 1] = c; }
        buildHeap(n);
        cur.caption = el('div', { textAlign: 'center', fontSize: '13px', color: 'var(--text-2)', minHeight: '18px' });
        cur.stripLabel = el('div', { fontSize: '12px', color: 'var(--text-3)' });
        cur.strip = el('div', { display: 'flex', gap: '3px', minHeight: '24px' });
        foot.append(cur.caption, cur.stripLabel, cur.strip);
      } else { cur.rows = E.buildPassLadder(steps); buildPasses(cur.rows, n); }
    }

    headL.textContent = '';
    let range = null, label = '';
    if (kind === 'recursion') {
      const active = paintRecursion(cur.model, idx, vals, states, max, snap);
      const path = E.callPath(cur.model, idx);
      if (path.length) path.forEach((nd, i) => { if (i) headL.appendChild(sep()); headL.appendChild(chip(`${nd.lo}–${nd.hi}`, i === path.length - 1)); });
      else headL.appendChild(el('span', { fontSize: '13px', color: 'var(--text-3)' }, idx === 0 ? 'The tree grows as each recursive call opens.' : 'Every call has returned.'));
      const returned = cur.model.nodes.filter((nd) => idx > nd.closedAt).length;
      headR.textContent = `${returned} / ${cur.model.nodes.length} calls returned` + (R.clipped ? ` · ${R.clipped} deeper hidden` : '');
      if (active) { range = { lo: active.lo, hi: active.hi }; label = `a[${active.lo}…${active.hi}]`; }
    } else if (kind === 'heap') {
      const heapSize = cur.heapAt[idx];
      const cursors = cur.curAt[idx];
      paintHeap(heapSize, cursors, vals, states, snap);
      const building = step && step.ctx && step.ctx.phase === 'Build max-heap';
      headL.appendChild(chip(idx === 0 ? 'Unordered array' : building ? 'Building the max-heap' : heapSize > 0 && idx < steps.length ? 'Extracting the maximum' : 'Sorted', true));
      headR.textContent = `heap size ${heapSize} / ${n}`;
      if (heapSize > 0) { range = { lo: 0, hi: heapSize - 1 }; label = 'max-heap'; }
      let cap = '';
      if (step && step.type === 'compare' && step.ctx && step.ctx.values) {
        const { a, b } = step.ctx.values;
        cap = cursors && step.i === cursors.root
          ? `${a} ${a < b ? '<' : '≥'} ${b} — ${a < b ? 'swap the parent below its larger child' : 'heap property holds here'}`
          : `Picking the larger child: ${a} vs ${b}`;
      } else if (step && step.type === 'swap' && step.i === 0 && !(cursors && cursors.child != null)) cap = 'Largest value moves to the back of the array';
      cur.caption.textContent = cap;
      const extracted = n - heapSize;
      cur.stripLabel.textContent = extracted > 0 ? `Extracted and final — ${extracted} ${extracted === 1 ? 'value' : 'values'}` : 'Extracted values land here, largest last.';
      cur.strip.textContent = '';
      for (let k = heapSize; k < n; k++) {
        cur.strip.appendChild(el('span', { flex: '1', minWidth: '0', padding: '4px 0', borderRadius: '6px', textAlign: 'center', fontFamily: MONO, fontSize: n > 40 ? '0px' : '10.5px', fontWeight: '600', color: '#fff', background: sv('sorted') }, String(Math.round(vals[k]))));
      }
    } else {
      const { activeRow, done } = paintPasses(idx);
      headL.appendChild(chip(activeRow ? `Pass ${activeRow.row.index} of ${cur.rows.length}` : idx === 0 ? `${cur.rows.length} passes ahead` : `${done} passes complete`, !!activeRow));
      headR.textContent = `${P.total} comparisons in total`;
      if (activeRow && activeRow.row.window) { range = activeRow.row.window; label = `window a[${range.lo}…${range.hi}]`; }
    }
    paintRibbon(vals, states, max, range, label, snap);
  }

  return {
    update,
    dispose() { ro.disconnect(); root.remove(); },
  };
}
