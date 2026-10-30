// Plain three.js port of src/components/three/CraneView.tsx (CraneScene + CameraRig).
// Geometry, materials, lighting and the per-step pick-and-place timeline are unchanged.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const WORLD_W = 11, BOX_H_MIN = 0.32, BOX_H_MAX = 2.75, RAIL_Y = 5, CLAW_PARK_Y = 4.15, LIFT = 1.15, JAW_GAP = 0.3, PAD_T = 0.03;
const PH = { approach: 0.14, descend: 0.3, grip: 0.38, lifted: 0.52, carried: 0.72, placed: 0.86, released: 0.93 };
const EMISSIVE = { default: 0.04, comparing: 0.55, swapping: 0.7, overwriting: 0.6, pivot: 0.5, sorted: 0.28 };
const CAM_Z_BASE = 10.2, FRAME_HALF_W = 6.9;
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const mix = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: o.m ?? 0.5, roughness: o.r ?? 0.5, emissive: o.e ? color : 0x000000, emissiveIntensity: o.e ?? 0 });
}
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function makeLabelTexture(value) {
  const S = 128, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f2f5fb';
  ctx.font = '600 68px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), S / 2, S / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function softShadowTexture() {
  const S = 128, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.9)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(cv);
}

export function createCrane(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 3.5, CAM_Z_BASE);
  camera.lookAt(0, 2, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(3, 9, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-6, 4, 6); scene.add(fill);
  const rimA = new THREE.PointLight(0xf5b417, 12, 16); rimA.position.set(-4.5, 2.4, 7.5); scene.add(rimA);
  const rimB = new THREE.PointLight(0x8ce046, 10, 16); rimB.position.set(4.5, 2.2, 7.5); scene.add(rimB);

  const shadowTex = softShadowTexture();
  const texCache = new Map();
  const labelTex = (v) => { let t = texCache.get(v); if (!t) { t = makeLabelTexture(v); texCache.set(v, t); } return t; };

  let rig = null; // rebuilt when n changes
  let props = null;
  const pointer = { x: 0, y: 0 };
  const clawX = { v: 0 }, clawY = { v: CLAW_PARK_Y };
  const m = { fromX: [], toX: [], fromH: [], toH: [], curX: [], curH: [], carriedId: -1, liftAmp: 0, clawFromX: 0, clawFromY: CLAW_PARK_Y, focus: 0, prevI: -1, prevJ: -1, t: 1, dur: 0, index: -1, run: null };
  const colorCache = {};
  const col = (hex) => colorCache[hex] || (colorCache[hex] = new THREE.Color(hex));
  let settled = false;

  function disposeGroup(g) {
    g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.userData.shared) o.material.dispose(); });
  }

  function build(n) {
    if (rig) { scene.remove(rig.root); disposeGroup(rig.root); }
    const root = new THREE.Group();
    const slot = WORLD_W / Math.max(1, n);
    const boxW = slot * 0.68;
    const boxD = Math.min(0.75, Math.max(0.28, slot * 0.72));
    const postX = WORLD_W / 2 + 0.75;
    const fingerW = Math.min(0.2, Math.max(0.075, boxW * 0.1));
    const fingerH = Math.min(0.62, Math.max(0.34, boxW * 0.34));
    const tipW = Math.min(0.4, Math.max(0.16, boxW * 0.22));
    const knuckle = Math.min(0.11, Math.max(0.05, boxW * 0.062));

    // Shelf
    root.add(box(WORLD_W + 1.6, 0.3, boxD + 1, std(0x2c3549, { m: 0.5, r: 0.6 }), 0, -0.26, 0));
    root.add(box(WORLD_W + 1.35, 0.08, boxD + 0.8, std(0x46536e, { m: 0.65, r: 0.4 }), 0, -0.08, 0));
    for (const s of [-1, 1]) root.add(box(WORLD_W + 1.5, 0.14, 0.07, std(0x5d6b8a, { m: 0.75, r: 0.35 }), 0, -0.12, s * (boxD / 2 + 0.4)));
    // Ground shadow
    const gShadow = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W + 4, boxD + 3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.28, depthWrite: false }));
    gShadow.rotation.x = -Math.PI / 2; gShadow.position.y = -0.42; root.add(gShadow);

    // Gantry legs
    for (const x of [-postX, postX]) {
      const g = new THREE.Group(); g.position.x = x;
      g.add(box(0.5, 0.12, 0.5, std(0x3b465e, { m: 0.7, r: 0.4 }), 0, -0.05, 0));
      g.add(box(0.2, RAIL_Y, 0.2, std(0x5a6884, { m: 0.78, r: 0.32 }), 0, RAIL_Y / 2, 0));
      const gus = box(0.1, 0.62, 0.14, std(0x4a5771, { m: 0.75, r: 0.35 }), x > 0 ? -0.33 : 0.33, RAIL_Y - 0.36, 0);
      gus.rotation.z = Math.PI / 4; g.add(gus);
      g.add(box(0.23, 0.16, 0.23, std(0xf5b417, { m: 0.5, r: 0.45, e: 0.18 }), 0, 0.42, 0));
      root.add(g);
    }
    // I-beam
    const beam = new THREE.Group(); beam.position.y = RAIL_Y;
    beam.add(box(postX * 2 + 0.2, 0.1, 0.44, std(0x5a6884, { m: 0.78, r: 0.32 }), 0, 0.17, 0));
    beam.add(box(postX * 2 + 0.2, 0.26, 0.14, std(0x46536e, { m: 0.7, r: 0.4 })));
    beam.add(box(postX * 2 + 0.2, 0.1, 0.4, std(0x5a6884, { m: 0.78, r: 0.32 }), 0, -0.17, 0));
    for (const s of [-1, 1]) beam.add(box(0.1, 0.3, 0.46, std(0xf5b417, { m: 0.5, r: 0.45 }), s * (postX - 0.06), -0.05, 0));
    root.add(beam);

    // Trolley
    const trolley = new THREE.Group(); trolley.position.y = RAIL_Y;
    trolley.add(box(0.62, 0.3, 0.4, std(0xf5b417, { m: 0.62, r: 0.32, e: 0.28 }), 0, 0.02, 0));
    trolley.add(box(0.34, 0.16, 0.3, std(0x39435a, { m: 0.7, r: 0.35 }), 0, 0.22, 0));
    for (const wx of [-0.22, 0.22]) for (const wz of [-0.17, 0.17]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 14), std(0x2b3446, { m: 0.8, r: 0.3 }));
      w.position.set(wx, 0.19, wz); w.rotation.z = Math.PI / 2; trolley.add(w);
    }
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16), std(0x8f9bb3, { m: 0.85, r: 0.28 }));
    drum.position.y = -0.12; drum.rotation.z = Math.PI / 2; trolley.add(drum);
    root.add(trolley);

    // Twin cables
    const strap = new THREE.Group(); strap.position.y = RAIL_Y;
    for (const s of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), std(0x9aa5bb, { m: 0.6, r: 0.5 }));
      c.position.z = s * 0.09; strap.add(c);
    }
    root.add(strap);

    // Lifting block + jaws
    const claw = new THREE.Group(); claw.position.y = CLAW_PARK_Y;
    claw.add(box(0.3, 0.24, boxD * 0.5 + 0.12, std(0x39435a, { m: 0.75, r: 0.32 }), 0, 0.2, 0));
    claw.add(box(Math.max(0.36, boxW * 1.02), 0.16, boxD * 0.9, std(0xf5b417, { m: 0.66, r: 0.28, e: 0.4 })));
    claw.add(box(Math.max(0.3, boxW * 0.86), 0.06, boxD * 0.72, std(0x2b3446, { m: 0.8, r: 0.3 }), 0, -0.1, 0));
    for (const s of [-1, 1]) {
      const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.26, 10), std(0xc7cede, { m: 0.85, r: 0.22 }));
      ram.position.set(s * Math.max(0.13, boxW * 0.3), -0.06, 0); ram.rotation.z = s * -0.5; claw.add(ram);
    }
    const jaws = {};
    for (const s of [-1, 1]) {
      const j = new THREE.Group(); j.position.set(s * (boxW * 0.5 + fingerW * 0.5 + PAD_T), -0.05, 0);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(knuckle, knuckle, boxD * 0.78, 12), std(0x8f9bb3, { m: 0.85, r: 0.25 }));
      pin.rotation.x = Math.PI / 2; j.add(pin);
      const steel = std(0xc7cede, { m: 0.72, r: 0.32 });
      j.add(box(fingerW, fingerH, boxD * 0.7, steel, 0, -fingerH / 2, 0));
      j.add(box(tipW, fingerW * 0.9, boxD * 0.7, steel, s * tipW * 0.32, -fingerH + fingerW * 0.4, 0));
      j.add(box(PAD_T, fingerH * 0.7, boxD * 0.62, std(0x12161d, { m: 0.1, r: 0.9 }), -s * (fingerW * 0.5 + PAD_T * 0.5), -fingerH * 0.55, 0));
      claw.add(j); jaws[s] = j;
    }
    root.add(claw);

    // Boxes
    const boxGeo = new THREE.BoxGeometry(boxW, 1, boxD);
    const labelGeo = new THREE.PlaneGeometry(boxW * 0.72, boxW * 0.72);
    const shadowGeo = new THREE.PlaneGeometry(boxW * 1.9, boxD * 2.2);
    const boxes = [];
    for (let id = 0; id < n; id++) {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ metalness: 0.35, roughness: 0.45, color: 0xffffff });
      const mesh = new THREE.Mesh(boxGeo, mat);
      g.add(mesh);
      const lab = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ transparent: true }));
      lab.position.set(0, 0.5, boxD / 2 + 0.012);
      g.add(lab);
      const sh = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012;
      root.add(sh);
      root.add(g);
      boxes.push({ g, mesh, mat, lab, sh, val: null });
    }
    scene.add(root);
    rig = { root, n, slot, boxW, boxD, fingerW, trolley, strap, claw, jawL: jaws[-1], jawR: jaws[1], boxes };
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const onPointer = (e) => {
    const r = container.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  window.addEventListener('pointermove', onPointer);

  const framingZ = () => Math.max(CAM_Z_BASE, FRAME_HALF_W / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect));

  const clock = new THREE.Clock();
  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    if (props && rig) step(delta, elapsed);
    // Camera rig
    const z = framingZ();
    if (!settled || (props && props.reduced)) { settled = true; camera.position.set(0, 3.5, z); }
    else {
      const bob = props && props.done ? Math.sin(elapsed * 1.5) * 0.1 : 0;
      camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.03;
      camera.position.y += (3.5 + bob + pointer.y * 0.35 - camera.position.y) * 0.03;
      camera.position.z += (z - camera.position.z) * 0.05;
    }
    camera.lookAt(0, 2, 0);
    renderer.render(scene, camera);
  }

  function step(delta, elapsed) {
    const { run, index, posOf, values, state, snap, reduced, stepMs, playing, colors, comparedSlots } = props;
    const st = props.step;
    const n = posOf.length;
    if (rig.n !== n) build(n);
    const { slot, boxW, fingerW } = rig;
    const instant = snap || reduced;
    let maxValue = 1;
    if (run._max == null) { for (const vs of run.values) for (const v of vs) if (v > maxValue) maxValue = v; run._max = maxValue; }
    maxValue = run._max;
    const xOfPos = (p) => (p - (n - 1) / 2) * slot;
    const hOfValue = (v) => BOX_H_MIN + (v / maxValue) * (BOX_H_MAX - BOX_H_MIN);

    if (m.run !== run) {
      m.run = run; m.index = index; m.t = 1; m.dur = 0; m.carriedId = -1; m.focus = 0; m.prevI = m.prevJ = -1;
      for (let id = 0; id < n; id++) {
        const x = xOfPos(posOf[id]), h = hOfValue(values[id]);
        m.fromX[id] = m.toX[id] = m.curX[id] = x;
        m.fromH[id] = m.toH[id] = m.curH[id] = h;
        rig.boxes[id].mat.userData.tinted = false;
      }
      for (const k of ['fromX', 'toX', 'curX', 'fromH', 'toH', 'curH']) m[k].length = n;
    }

    if (m.index !== index) {
      const jumped = Math.abs(index - m.index) > 1;
      m.index = index; m.carriedId = -1; m.liftAmp = 0;
      let widest = 0;
      for (let id = 0; id < n; id++) {
        m.fromX[id] = m.curX[id]; m.fromH[id] = m.curH[id];
        m.toX[id] = xOfPos(posOf[id]); m.toH[id] = hOfValue(values[id]);
        const span = m.toX[id] - m.fromX[id], dist = Math.abs(span);
        if (dist > 0.001 && (dist > widest + 0.001 || (dist > widest - 0.001 && span > 0))) { widest = dist; m.carriedId = id; }
      }
      if (m.carriedId >= 0) {
        const want = LIFT * Math.min(1.4, widest / Math.max(slot, 0.001));
        const headroom = RAIL_Y - 0.3 - m.fromH[m.carriedId] - JAW_GAP;
        m.liftAmp = Math.max(0.3, Math.min(want, headroom));
      }
      m.clawFromX = clawX.v; m.clawFromY = clawY.v;
      if (st) {
        if (st.type === 'compare') {
          const [ci, cj] = comparedSlots(st);
          const movedI = ci !== m.prevI, movedJ = cj !== m.prevJ;
          m.focus = movedI && !movedJ ? ci : movedJ && !movedI ? cj : ci;
          m.prevI = ci; m.prevJ = cj;
        } else if (st.type === 'overwrite' || st.type === 'markPivot') m.focus = st.index;
        else if (st.type === 'swap') m.focus = st.j;
        else if (st.type === 'markSorted' && st.indices.length > 0) m.focus = st.indices[st.indices.length - 1];
        m.focus = Math.max(0, Math.min(n - 1, m.focus));
      }
      const budget = playing ? Math.min(stepMs * 0.96, 3000) : 1100;
      m.dur = instant || jumped ? 0 : budget / 1000;
      m.t = m.dur > 0 ? 0 : 1;
    }

    if (m.t < 1) m.t = m.dur > 0 ? Math.min(1, m.t + delta / m.dur) : 1;
    const t = m.t, cid = m.carriedId;
    const tp = cid >= 0 ? easeInOut(seg(t, PH.lifted, PH.carried)) : easeInOut(t);
    const th = easeOut(cid >= 0 ? seg(t, PH.grip, PH.placed) : t);
    let carryLift = 0;
    if (cid >= 0) {
      if (t < PH.grip) carryLift = 0;
      else if (t < PH.lifted) carryLift = easeInOut(seg(t, PH.grip, PH.lifted)) * m.liftAmp;
      else if (t < PH.carried) carryLift = m.liftAmp;
      else if (t < PH.placed) carryLift = (1 - easeInOut(seg(t, PH.carried, PH.placed))) * m.liftAmp;
    }
    for (let id = 0; id < n; id++) {
      m.curX[id] = m.fromX[id] + (m.toX[id] - m.fromX[id]) * tp;
      m.curH[id] = m.fromH[id] + (m.toH[id] - m.fromH[id]) * th;
    }

    let jaw = 1, cmdX = clawX.v, cmdY = CLAW_PARK_Y, lagRate = 14;
    if (cid >= 0 && !instant) {
      lagRate = 30;
      const onBox = carryLift + m.curH[cid] + JAW_GAP;
      if (t < PH.approach) {
        const e = easeInOut(seg(t, 0, PH.approach));
        cmdX = mix(m.clawFromX, m.curX[cid], e); cmdY = mix(m.clawFromY, CLAW_PARK_Y, e);
      } else if (t < PH.descend) {
        cmdX = m.curX[cid]; cmdY = mix(CLAW_PARK_Y, onBox, easeInOut(seg(t, PH.approach, PH.descend)));
      } else if (t < PH.released) {
        cmdX = m.curX[cid]; cmdY = onBox;
        if (t < PH.grip) jaw = 1 - easeInOut(seg(t, PH.descend, PH.grip));
        else if (t < PH.placed) jaw = 0;
        else jaw = easeInOut(seg(t, PH.placed, PH.released));
      } else {
        cmdX = m.curX[cid]; cmdY = mix(onBox, CLAW_PARK_Y, easeInOut(seg(t, PH.released, 1)));
      }
    } else if (!instant) {
      let toX = m.clawFromX, toY = CLAW_PARK_Y;
      if (st) {
        toX = xOfPos(m.focus);
        if (st.type === 'overwrite') {
          const overId = posOf.findIndex((p) => p === m.focus);
          const top = overId >= 0 ? m.curH[overId] : 1;
          toY = Math.min(CLAW_PARK_Y, top + JAW_GAP + 0.2);
        }
      }
      cmdX = mix(m.clawFromX, toX, easeInOut(seg(t, 0, 0.55)));
      cmdY = mix(m.clawFromY, toY, easeInOut(seg(t, 0.4, 0.9)));
      if (t >= 1) cmdY += Math.sin(elapsed * 1.1) * 0.045;
      lagRate = 60;
    }
    const ck = instant ? 1 : 1 - Math.exp(-lagRate * Math.min(delta, 0.05));
    clawX.v += (cmdX - clawX.v) * ck;
    clawY.v += (cmdY - clawY.v) * (instant ? 1 : 1 - Math.exp(-Math.max(lagRate, 30) * Math.min(delta, 0.05)));

    if (cid >= 0 && t >= PH.grip && !instant) {
      const pin = 1 - easeInOut(seg(t, PH.carried, PH.placed));
      m.curX[cid] = mix(m.curX[cid], clawX.v, pin);
    }

    const showLabels = n <= 20;
    for (let id = 0; id < n; id++) {
      const b = rig.boxes[id];
      const lift = id === cid ? carryLift : 0;
      b.g.position.x = m.curX[id]; b.g.position.y = lift;
      b.sh.position.x = m.curX[id];
      b.sh.material.opacity = 0.45 * Math.max(0.25, 1 - lift / 1.6);
      b.mesh.scale.y = m.curH[id]; b.mesh.position.y = m.curH[id] / 2;
      b.lab.visible = showLabels;
      b.lab.position.y = Math.max(0.22, m.curH[id] - Math.min(0.42, m.curH[id] * 0.34));
      const v = Math.round(values[id]);
      if (showLabels && b.val !== v) { b.val = v; b.lab.material.map = labelTex(v); b.lab.material.needsUpdate = true; }
      const s = state[id] || 'default';
      const target = col(colors[s] || colors.default);
      const cf = instant || !b.mat.userData.tinted ? 1 : Math.min(1, delta * 14);
      b.mat.userData.tinted = true;
      b.mat.color.lerp(target, cf);
      b.mat.emissive.lerp(target, cf);
      b.mat.emissiveIntensity = EMISSIVE[s] ?? EMISSIVE.default;
    }

    const halfW = boxW * 0.5 + fingerW * 0.5 + PAD_T;
    rig.jawL.position.x = -(halfW + jaw * 0.12); rig.jawL.rotation.z = jaw * 0.5;
    rig.jawR.position.x = halfW + jaw * 0.12; rig.jawR.rotation.z = -jaw * 0.5;
    rig.trolley.position.x = clawX.v;
    rig.claw.position.x = clawX.v; rig.claw.position.y = clawY.v;
    const len = Math.max(0.05, RAIL_Y - clawY.v);
    rig.strap.position.x = clawX.v; rig.strap.position.y = clawY.v + len / 2; rig.strap.scale.y = len;
  }

  tick();

  return {
    update(p) { props = p; if (!rig || rig.n !== p.posOf.length) build(p.posOf.length); },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      if (rig) disposeGroup(rig.root);
      for (const t of texCache.values()) t.dispose();
      shadowTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
