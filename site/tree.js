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
  let R = null;
  function buildRecursion(model, n) {
    body.textContent = '';
    const slot = n <= 8 ? 92 : n <= 16 ? 70 : n <= 32 ? 50 : 40;
    const depth = Math.min(model.maxDepth, MAX_DEPTH);
    const nodeW = slot - 10, nodeH = 42, pad = 16;
    const bh0 = Math.max(160, body.clientHeight);
    // Deep trees squeeze their level spacing before anything shrinks.
    const level = Math.max(56, Math.min(74, (bh0 - pad * 2 - nodeH) / Math.max(1, depth)));
    const natW = model.width * slot + pad * 2, natH = (depth + 1) * level - (level - nodeH) + pad * 2;
    const bw = Math.max(200, body.clientWidth), bh = Math.max(160, body.clientHeight);
    const fitBoth = Math.min(bw / natW, bh / natH);
    const scale = fitBoth >= 0.8 ? Math.min(1.15, fitBoth) : Math.max(0.7, Math.min(1.15, bw / natW));
    const svgEl = svg('svg', { viewBox: `0 0 ${natW} ${natH}`, width: natW * scale, height: natH * scale }, { display: 'block', margin: '0 auto', overflow: 'visible' });
    const gEdges = svg('g'), gNodes = svg('g');
    svgEl.append(gEdges, gNodes);
    body.appendChild(svgEl);
    const cx = (nd) => pad + nd.x * slot + slot / 2;
    const cy = (nd) => pad + nd.depth * level + nodeH / 2;
    const visible = model.nodes.filter((nd) => nd.depth <= MAX_DEPTH);
    const edges = [];
    for (const nd of visible) for (const ch of nd.children) {
      if (ch.depth > MAX_DEPTH) continue;
      const x1 = cx(nd), y1 = cy(nd) + nodeH / 2, x2 = cx(ch), y2 = cy(ch) - nodeH / 2, my = (y1 + y2) / 2;
      const p = svg('path', { d: `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`, fill: 'none' }, { transition: 'stroke .2s ease, stroke-width .2s ease' });
      gEdges.appendChild(p);
      edges.push({ p, parent: nd, child: ch });
    }
    const nodes = visible.map((nd) => {
      const g = svg('g', { transform: `translate(${cx(nd) - nodeW / 2} ${cy(nd) - nodeH / 2})` }, { transition: 'opacity .25s ease' });
      const halo = svg('rect', { x: -4, y: -4, width: nodeW + 8, height: nodeH + 8, rx: 14, fill: 'none' }, { stroke: 'var(--text)', strokeWidth: '1', opacity: '0', transition: 'opacity .2s ease' });
      const box = svg('rect', { x: 0, y: 0, width: nodeW, height: nodeH, rx: 10 }, { transition: 'fill .2s ease, stroke .2s ease' });
      const prog = svg('rect', { x: 0, y: nodeH - 3, width: 0, height: 3, rx: 1.5 }, { fill: sv('overwriting'), transition: 'width .15s ease' });
      const size = nd.hi - nd.lo + 1;
      const leaf = size === 1;
      const label = svg('text', { x: nodeW / 2, y: leaf ? 15 : 16, 'text-anchor': 'middle' }, { fontFamily: MONO, fontSize: leaf ? '9.5px' : '11px', fontWeight: '500', transition: 'fill .2s ease' });
      label.textContent = leaf ? `a[${nd.lo}]` : `${nd.lo}–${nd.hi}`;
      g.append(halo, box, prog, label);
      let valueText = null;
      const spark = [];
      if (leaf) {
        valueText = svg('text', { x: nodeW / 2, y: 32, 'text-anchor': 'middle' }, { fontFamily: MONO, fontSize: '13px', fontWeight: '600', transition: 'fill .2s ease' });
        g.appendChild(valueText);
      } else {
        const k = Math.min(size, 12), inner = nodeW - 14, bwid = inner / k;
        for (let i = 0; i < k; i++) {
          const r = svg('rect', { x: 7 + i * bwid, width: Math.max(1, bwid - 1.5), rx: 1 }, { transition: 'height .15s ease, y .15s ease, fill .15s linear' });
          g.appendChild(r);
          spark.push({ r, pos: nd.lo + Math.floor((i * size) / k) });
        }
      }
      let badge = null, badgeText = null;
      if (nd.pivotAt !== null) {
        badge = svg('rect', { x: nodeW - 22, y: -9, width: 30, height: 16, rx: 8 }, { fill: sv('pivot') });
        badgeText = svg('text', { x: nodeW - 7, y: 3, 'text-anchor': 'middle' }, { fontFamily: MONO, fontSize: '9.5px', fontWeight: '600', fill: '#fff' });
        g.append(badge, badgeText);
      }
      gNodes.appendChild(g);
      return { nd, g, halo, box, prog, label, valueText, spark, badge, badgeText, leaf, nodeW, nodeH };
    });
    R = { svgEl, edges, nodes, clipped: model.nodes.length - visible.length, scale, cx, cy };
  }
  function paintRecursion(model, idx, vals, states, max, snap) {
    const active = E.activeNode(model, idx);
    const path = new Set(E.callPath(model, idx).map((n) => n.id));
    const tr = snap ? 'none' : null;
    for (const e of R.edges) {
      const open = idx > e.child.openedAt;
      const hot = path.has(e.parent.id) && path.has(e.child.id);
      set(e.p, 's:stroke', hot ? 'var(--text)' : open ? mixT(28) : mixT(12));
      set(e.p, 's:strokeWidth', hot ? '1.8' : '1.2');
      set(e.p, 's:strokeDasharray', open ? 'none' : '3 4');
    }
    for (const n of R.nodes) {
      const st = E.nodeStateAt(n.nd, idx);
      const isActive = active && n.nd.id === active.id;
      const onPath = path.has(n.nd.id);
      let fill = 'var(--surface)', stroke = mixT(16), dash = '3 3', sw = '1', fg = 'var(--text-3)';
      if (st === 'active') { fill = 'var(--surface)'; stroke = isActive ? 'var(--text)' : onPath ? mixT(55) : mixT(30); dash = 'none'; sw = isActive ? '1.6' : '1.1'; fg = 'var(--text)'; }
      else if (st === 'combining') { fill = `color-mix(in srgb, ${sv('overwriting')} 10%, var(--surface))`; stroke = sv('overwriting'); dash = 'none'; sw = '1.4'; fg = 'var(--text)'; }
      else if (st === 'returned') { fill = `color-mix(in srgb, ${sv('sorted')} 12%, var(--surface))`; stroke = `color-mix(in srgb, ${sv('sorted')} 55%, transparent)`; dash = 'none'; sw = '1'; fg = 'var(--text)'; }
      set(n.box, 's:fill', fill); set(n.box, 's:stroke', stroke); set(n.box, 's:strokeDasharray', dash); set(n.box, 's:strokeWidth', sw);
      set(n.label, 's:fill', st === 'pending' ? 'var(--text-3)' : n.leaf ? 'var(--text-3)' : fg);
      set(n.halo, 's:opacity', isActive ? '0.16' : '0');
      set(n.g, 's:opacity', st === 'pending' ? '0.55' : '1');
      const p = E.combineProgress(n.nd, idx);
      set(n.prog, 'width', String(p ? n.nodeW * p : 0));
      if (n.valueText) {
        set(n.valueText, 'text', st === 'pending' ? '·' : String(Math.round(vals[n.nd.lo])));
        set(n.valueText, 's:fill', st === 'pending' ? 'var(--text-3)' : 'var(--text)');
      }
      for (const b of n.spark) {
        const h = st === 'pending' ? 0 : Math.max(2, (vals[b.pos] / max) * 13);
        set(b.r, 'height', String(h)); set(b.r, 'y', String(n.nodeH - 6 - h));
        set(b.r, 's:fill', st === 'returned' ? `color-mix(in srgb, ${sv('sorted')} 75%, transparent)` : sv(states[b.pos]));
        if (snap) set(b.r, 's:transition', 'none');
      }
      if (n.badge) {
        const shown = idx > n.nd.pivotAt;
        const pos = n.nd.pivotSortedAt != null && idx >= n.nd.pivotSortedAt ? n.nd.pivotPos : n.nd.hi;
        set(n.badge, 's:opacity', shown ? '1' : '0'); set(n.badgeText, 's:opacity', shown ? '1' : '0');
        set(n.badgeText, 'text', String(Math.round(vals[pos])));
      }
      if (tr) { set(n.box, 's:transition', tr); }
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
    const { steps, frame, kind, snap } = p;
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
      if (kind === 'recursion') { cur.model = E.buildTreeModel(steps); buildRecursion(cur.model, n); }
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
