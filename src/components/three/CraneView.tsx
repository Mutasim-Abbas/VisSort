import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { Frame } from '../../engine/player';
import type { Step, BarState } from '../../engine/types';
import type { PlaybackStatus } from '../../hooks/usePlayback';
import { getAlgorithm, type AlgorithmKey } from '../../engine/registry';
import { PSEUDOCODE } from '../../engine/pseudocode';

/**
 * The "Crane" view (PLAN.md §FC1–FC9): the sort staged as a gantry crane lifting
 * numbered boxes on a shelf. It is a pure consumer of the same {@link Frame} the
 * 2D views receive — the engine is untouched. `frame` has already *applied* the
 * step, so every box lerps from where it is rendered toward its post-step
 * transform, and the claw is choreographed on top to read as the cause.
 */

/** Full 3D staging renders up to this many boxes (PLAN §FC5). */
export const CRANE_MAX = 32;
/** Above this count the printed value on each box face stops being readable. */
const LABEL_MAX = 20;
/** Pick-and-place cannot play this fast — boxes snap instead (matches BarCanvas). */
const SNAP_SPEED = 20;

/** World-space width the shelf of boxes always fills, whatever `n` is. */
const WORLD_W = 11;
const BOX_H_MIN = 0.32;
// Boxes stay short enough that even the tallest can be hoisted clear of the
// shelf without the claw punching through the rail (see the headroom clamp).
const BOX_H_MAX = 2.75;
const RAIL_Y = 5;
const CLAW_PARK_Y = 4.15;
/** How high above the shelf the claw carries a box. */
const LIFT = 1.15;
/** Gap between the claw head and the top face of the box it is gripping. */
const JAW_GAP = 0.3;

/**
 * The pick-and-place, as fractions of one step's timeline. The claw descends
 * with its jaws open, closes them on the box, lifts it clear of the shelf,
 * carries it across, sets it down, releases, and retracts. The box itself is
 * moved by these same phases, so it never drifts independently of the grab.
 */
const PH = {
  /** Trolley runs along the rail to sit over the box — height unchanged. */
  approach: 0.14,
  /** Hoist pays out; the open claw comes down onto the box. */
  descend: 0.3,
  /** Jaws close on it. */
  grip: 0.38,
  /** Box is hoisted clear of the shelf. */
  lifted: 0.52,
  /** Trolley carries it across to the destination slot. */
  carried: 0.72,
  /** Box is lowered back onto the shelf. */
  placed: 0.86,
  /** Jaws release. */
  released: 0.93,
} as const;

/** Normalized progress through a sub-window of the timeline. */
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type BoxColors = Record<BarState, THREE.Color>;

/** Resolve the palette from CSS tokens so the scene never hardcodes hex. */
function readColors(): BoxColors {
  const css = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) => {
    const v = css.getPropertyValue(name).trim();
    return new THREE.Color(v || fallback);
  };
  return {
    default: tok('--color-bar-default', '#4a5468'),
    comparing: tok('--color-bar-comparing', '#f5c518'),
    swapping: tok('--color-bar-swapping', '#ff6b4a'),
    pivot: tok('--color-bar-pivot', '#c77dff'),
    overwriting: tok('--color-bar-overwriting', '#45c4ff'),
    sorted: tok('--color-bar-sorted', '#8ce046'),
  };
}

/** Emissive punch per state — only the few active boxes glow (PLAN §FC4). */
const EMISSIVE: Record<BarState, number> = {
  default: 0.04,
  comparing: 0.55,
  swapping: 0.7,
  overwriting: 0.6,
  pivot: 0.5,
  sorted: 0.28,
};

/**
 * The value printed on a box face, drawn to a canvas so the scene needs no
 * webfont fetch. Cached per value and disposed with the view.
 */
function makeLabelTexture(value: number): THREE.CanvasTexture {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#f2f5fb';
    ctx.font = '600 68px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), S / 2, S / 2 + 4);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  return tex;
}

interface SceneProps {
  frame: Frame;
  step: Step | undefined;
  snap: boolean;
  reduced: boolean;
  done: boolean;
  /** Milliseconds the player spends on one step — the motion must fit inside it. */
  stepMs: number;
  playing: boolean;
}

/**
 * Per-step animation timeline, kept out of React so useFrame can mutate it.
 *
 * Every box is animated on ONE shared clock that runs `0 → 1` across the step
 * and then stops. This is deliberately not a "chase the target" lerp: an
 * exponential chase never actually arrives, so at any real playback speed the
 * next step interrupts the previous one and every box is permanently in
 * transit — motion reads mushy and the carry arc pops when it is finally
 * snapped. A bounded timeline lands each box exactly as the next step begins.
 */
interface Motion {
  /** Where this step started (world x / height), and where it ends. */
  fromX: number[];
  toX: number[];
  fromH: number[];
  toH: number[];
  /** Live values, also the `from` of the next step if it interrupts this one. */
  curX: number[];
  curH: number[];
  /** The single box the claw carries this step; -1 when nothing is lifted. */
  carriedId: number;
  /** Arc height for the carried box, scaled by how far it travels. */
  liftAmp: number;
  /** Where the claw was when this step opened, so it eases in rather than jumps. */
  clawFromX: number;
  clawFromY: number;
  /** Progress 0→1, and the duration in seconds this step animates over. */
  t: number;
  dur: number;
  /** The frame index this timeline was built for, and the array identity. */
  index: number;
  key: string;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function CraneScene({ frame, step, snap, reduced, done, stepMs, playing }: SceneProps) {
  const n = frame.heights.length;
  const colors = useMemo(readColors, []);

  const slot = WORLD_W / Math.max(1, n);
  const boxW = slot * 0.68;
  const boxD = Math.min(0.75, Math.max(0.28, slot * 0.72));
  const showLabels = n <= LABEL_MAX;

  const maxValue = useMemo(() => {
    let m = 1;
    for (const v of frame.heights) if (v > m) m = v;
    return m;
  }, [frame.heights]);

  const xOfPos = (pos: number) => (pos - (n - 1) / 2) * slot;
  const hOfValue = (v: number) => BOX_H_MIN + (v / maxValue) * (BOX_H_MAX - BOX_H_MIN);

  // Label textures, cached by the value they show and disposed on unmount.
  const texCache = useRef(new Map<number, THREE.CanvasTexture>());
  const labelTex = (value: number): THREE.CanvasTexture => {
    const cache = texCache.current;
    let t = cache.get(value);
    if (!t) {
      t = makeLabelTexture(value);
      cache.set(value, t);
    }
    return t;
  };
  useEffect(() => {
    const cache = texCache.current;
    return () => {
      for (const t of cache.values()) t.dispose();
      cache.clear();
    };
  }, []);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const labels = useRef<(THREE.Mesh | null)[]>([]);
  const trolley = useRef<THREE.Group>(null);
  const clawGroup = useRef<THREE.Group>(null);
  const strap = useRef<THREE.Mesh>(null);
  const jawL = useRef<THREE.Group>(null);
  const jawR = useRef<THREE.Group>(null);

  const motion = useRef<Motion>({
    fromX: [],
    toX: [],
    fromH: [],
    toH: [],
    curX: [],
    curH: [],
    carriedId: -1,
    liftAmp: 0,
    clawFromX: 0,
    clawFromY: CLAW_PARK_Y,
    t: 1,
    dur: 0,
    index: -1,
    key: '',
  });

  const clawX = useRef(0);
  const clawY = useRef(CLAW_PARK_Y);

  useFrame(({ clock }, delta) => {
    const m = motion.current;
    const instant = snap || reduced;
    const key = `${n}:${maxValue}`;

    // A new array (or a new size) re-seeds everything in place — no tweening
    // between two unrelated data sets.
    if (m.key !== key) {
      m.key = key;
      m.index = frame.index;
      m.t = 1;
      m.dur = 0;
      m.carriedId = -1;
      for (let id = 0; id < n; id++) {
        const x = xOfPos(frame.posOf[id]);
        const h = hOfValue(frame.heights[id]);
        m.fromX[id] = m.toX[id] = m.curX[id] = x;
        m.fromH[id] = m.toH[id] = m.curH[id] = h;
      }
      m.fromX.length = m.toX.length = m.curX.length = n;
      m.fromH.length = m.toH.length = m.curH.length = n;
    }

    // Open a fresh timeline whenever the player moved to another step.
    if (m.index !== frame.index) {
      // Scrubbing or resetting jumps more than one step — land immediately
      // rather than animating through positions the player never showed.
      const jumped = Math.abs(frame.index - m.index) > 1;
      m.index = frame.index;
      m.carriedId = -1;
      m.liftAmp = 0;

      let widest = 0;
      for (let id = 0; id < n; id++) {
        m.fromX[id] = m.curX[id];
        m.fromH[id] = m.curH[id];
        m.toX[id] = xOfPos(frame.posOf[id]);
        m.toH[id] = hOfValue(frame.heights[id]);

        // Only the box travelling RIGHT is craned over; its partner slides
        // along the shelf beneath it. Lifting both makes them intersect.
        const span = m.toX[id] - m.fromX[id];
        if (span > 0.001 && span > widest) {
          widest = span;
          m.carriedId = id;
        }
      }
      if (m.carriedId >= 0) {
        // Longer journeys ride higher, but never so high that the claw head
        // would pass through the top rail.
        const want = LIFT * Math.min(1.4, widest / Math.max(slot, 0.001));
        const headroom = RAIL_Y - 0.3 - m.fromH[m.carriedId] - JAW_GAP;
        m.liftAmp = Math.max(0.3, Math.min(want, headroom));
      }
      m.clawFromX = clawX.current;
      m.clawFromY = clawY.current;

      // The animation must finish inside the player's own step interval or the
      // next step interrupts it. When paused (manual stepping) there is no
      // interval to respect, so use a comfortable fixed beat.
      // Use nearly the whole step so the seven phases have room to read. The
      // machine can never take longer than the player's own interval without
      // being cut off mid-grab, so a slower crane means a slower step rate —
      // which is why the speed slider reaches down to 0.25 steps/s.
      const budget = playing ? Math.min(stepMs * 0.96, 3000) : 1100;
      m.dur = instant || jumped ? 0 : budget / 1000;
      m.t = m.dur > 0 ? 0 : 1;
    }

    if (m.t < 1) m.t = m.dur > 0 ? Math.min(1, m.t + delta / m.dur) : 1;
    const t = m.t;
    const cid = m.carriedId;

    // Boxes only travel sideways while the claw is actually carrying, so the
    // lifted box and the partner sliding beneath it move in the same window.
    const tp = cid >= 0 ? easeInOut(seg(t, PH.lifted, PH.carried)) : easeInOut(t);
    const th = easeOut(cid >= 0 ? seg(t, PH.grip, PH.placed) : t);

    // Vertical profile of the grabbed box: still → rises → held → set down.
    let carryLift = 0;
    if (cid >= 0) {
      if (t < PH.grip) carryLift = 0;
      else if (t < PH.lifted) carryLift = easeInOut(seg(t, PH.grip, PH.lifted)) * m.liftAmp;
      else if (t < PH.carried) carryLift = m.liftAmp;
      else if (t < PH.placed)
        carryLift = (1 - easeInOut(seg(t, PH.carried, PH.placed))) * m.liftAmp;
    }

    // Solve the timeline first — the crane is solved against these values, and
    // the gripped box is then re-pinned to wherever the claw actually ended up.
    for (let id = 0; id < n; id++) {
      m.curX[id] = m.fromX[id] + (m.toX[id] - m.fromX[id]) * tp;
      m.curH[id] = m.fromH[id] + (m.toH[id] - m.fromH[id]) * th;
    }

    // ---- Claw ------------------------------------------------------------
    // While carrying, the claw is driven by the same phase clock as the box so
    // the two are rigidly attached: it reaches down to the box, grips, rises
    // with it, travels, sets it down, lets go, and retracts. Everything else
    // (hovering over a comparison, a write, a pivot) is a soft chase.
    let jaw = 1; // 1 = mouth open, 0 = clamped on the box

    // `cmd` is where the trolley is commanded to be; the hook is allowed to
    // trail behind it, which is what puts a real angle in the cable.
    let cmdX = clawX.current;
    let cmdY = CLAW_PARK_Y;
    let lagRate = 14;

    if (cid >= 0 && !instant) {
      lagRate = 30;
      // Hook height once the claw is engaged: it simply rides the box top.
      const onBox = carryLift + m.curH[cid] + JAW_GAP;
      if (t < PH.approach) {
        // Run along the rail at travel height — no hoisting while traversing.
        const e = easeInOut(seg(t, 0, PH.approach));
        cmdX = mix(m.clawFromX, m.curX[cid], e);
        cmdY = mix(m.clawFromY, CLAW_PARK_Y, e);
      } else if (t < PH.descend) {
        // Pay out the hoist straight down onto the box.
        cmdX = m.curX[cid];
        cmdY = mix(CLAW_PARK_Y, onBox, easeInOut(seg(t, PH.approach, PH.descend)));
      } else if (t < PH.released) {
        cmdX = m.curX[cid];
        cmdY = onBox;
        if (t < PH.grip) jaw = 1 - easeInOut(seg(t, PH.descend, PH.grip));
        else if (t < PH.placed) jaw = 0;
        else jaw = easeInOut(seg(t, PH.placed, PH.released));
      } else {
        // Let go and draw the empty hook back up to travel height.
        cmdX = m.curX[cid];
        cmdY = mix(onBox, CLAW_PARK_Y, easeInOut(seg(t, PH.released, 1)));
      }
    } else if (!instant) {
      // Empty hook. It still moves like a machine rather than snapping at a
      // target: traverse along the rail first, then take up or pay out the
      // hoist — the same two-beat motion as a real gantry, on the same clock.
      let toX = m.clawFromX;
      let toY = CLAW_PARK_Y;
      if (step) {
        if (step.type === 'compare') {
          toX = (xOfPos(step.i) + xOfPos(step.j)) / 2;
          toY = CLAW_PARK_Y - 0.45;
        } else if (step.type === 'overwrite') {
          toX = xOfPos(step.index);
          const id = frame.posOf.findIndex((p) => p === step.index);
          toY = (id >= 0 ? m.curH[id] : 1) + JAW_GAP;
        } else if (step.type === 'markPivot') {
          toX = xOfPos(step.index);
          toY = CLAW_PARK_Y - 0.25;
        }
      }
      cmdX = mix(m.clawFromX, toX, easeInOut(seg(t, 0, 0.55)));
      cmdY = mix(m.clawFromY, toY, easeInOut(seg(t, 0.4, 0.9)));
      // Once it has arrived, let it hang and breathe rather than freeze dead.
      if (t >= 1) cmdY += Math.sin(clock.getElapsedTime() * 1.1) * 0.045;
      lagRate = 60; // effectively rigid — the easing above *is* the motion
    }

    // The hook follows its commanded position; hoisting is rigid.
    const ck = instant ? 1 : 1 - Math.exp(-lagRate * Math.min(delta, 0.05));
    clawX.current += (cmdX - clawX.current) * ck;
    clawY.current +=
      (cmdY - clawY.current) *
      (instant ? 1 : 1 - Math.exp(-Math.max(lagRate, 30) * Math.min(delta, 0.05)));

    // The gripped box hangs off the hook and follows it exactly. Release the
    // pin as it is set down so it lands precisely on its slot.
    if (cid >= 0 && t >= PH.grip && !instant) {
      const pin = 1 - easeInOut(seg(t, PH.carried, PH.placed));
      m.curX[cid] = mix(m.curX[cid], clawX.current, pin);
    }

    // Render the boxes now that the crane has been solved.
    for (let id = 0; id < n; id++) {
      const lift = id === cid ? carryLift : 0;
      const g = groups.current[id];
      if (g) {
        g.position.x = m.curX[id];
        g.position.y = lift;
      }
      const mesh = meshes.current[id];
      if (mesh) {
        mesh.scale.y = m.curH[id];
        mesh.position.y = m.curH[id] / 2;
      }
      const lab = labels.current[id];
      if (lab) lab.position.y = Math.max(0.22, m.curH[id] - Math.min(0.42, m.curH[id] * 0.34));

      const mat = mats.current[id];
      if (mat) {
        const state = frame.state[id];
        const target = colors[state] ?? colors.default;
        // Materials are born white; snap the first frame so no box flashes.
        const cf = instant || !mat.userData.tinted ? 1 : Math.min(1, delta * 14);
        mat.userData.tinted = true;
        mat.color.lerp(target, cf);
        mat.emissive.lerp(target, cf);
        mat.emissiveIntensity = EMISSIVE[state] ?? EMISSIVE.default;
      }
    }

    // Jaws hinge from the underside of the head and splay outward when open.
    const halfW = Math.max(0.16, boxW * 0.5) + 0.05;
    if (jawL.current) {
      jawL.current.position.x = -(halfW + jaw * 0.12);
      jawL.current.rotation.z = jaw * 0.5;
    }
    if (jawR.current) {
      jawR.current.position.x = halfW + jaw * 0.12;
      jawR.current.rotation.z = -jaw * 0.5;
    }

    // The trolley sits directly above the hook, so the hoist cable hangs plumb.
    // (An earlier version let the hook trail and tilted the cable; near the rail
    // the vertical run is tiny, so any lag read as a snapped, flailing arm.)
    if (trolley.current) trolley.current.position.x = clawX.current;
    if (clawGroup.current) {
      clawGroup.current.position.x = clawX.current;
      clawGroup.current.position.y = clawY.current;
    }
    if (strap.current) {
      const len = Math.max(0.05, RAIL_Y - clawY.current);
      strap.current.position.x = clawX.current;
      strap.current.position.y = clawY.current + len / 2;
      strap.current.scale.y = len;
    }
  });

  const postX = WORLD_W / 2 + 0.75;
  const ids = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);

  return (
    <>
      {/* Neutral key + fill so the box tokens read true; the tinted rims sit well
          in front of the gantry so they graze the boxes instead of blowing out
          the posts they used to sit inside. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 9, 8]} intensity={1.5} />
      <directionalLight position={[-6, 4, 6]} intensity={0.35} />
      <pointLight position={[-4.5, 2.4, 7.5]} intensity={12} color="#f5b417" distance={16} />
      <pointLight position={[4.5, 2.2, 7.5]} intensity={10} color="#8ce046" distance={16} />

      {/* Shelf */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[WORLD_W + 1.6, 0.4, boxD + 1]} />
        <meshStandardMaterial color="#39445c" metalness={0.5} roughness={0.55} />
      </mesh>

      {/* Gantry: two posts + top rail */}
      {[-postX, postX].map((x) => (
        <mesh key={x} position={[x, RAIL_Y / 2, 0]}>
          <boxGeometry args={[0.16, RAIL_Y, 0.16]} />
          <meshStandardMaterial color="#5a6884" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, RAIL_Y, 0]}>
        <boxGeometry args={[postX * 2 + 0.16, 0.16, 0.16]} />
        <meshStandardMaterial color="#5a6884" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Trolley + strap + claw */}
      <group ref={trolley} position={[0, RAIL_Y, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.22, 0.3]} />
          <meshStandardMaterial
            color="#f5b417"
            emissive="#f5b417"
            emissiveIntensity={0.35}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>
      <mesh ref={strap} position={[0, RAIL_Y, 0]}>
        <boxGeometry args={[0.035, 1, 0.035]} />
        <meshStandardMaterial color="#8792a8" metalness={0.4} roughness={0.6} />
      </mesh>
      <group ref={clawGroup} position={[0, CLAW_PARK_Y, 0]}>
        <mesh>
          <boxGeometry args={[Math.max(0.3, boxW * 0.9), 0.13, boxD * 0.85]} />
          <meshStandardMaterial
            color="#f5b417"
            emissive="#f5b417"
            emissiveIntensity={0.45}
            metalness={0.65}
            roughness={0.3}
          />
        </mesh>
        {/* Jaws — each hinges from the underside of the head, so rotating the
            group swings the finger outward like a mouth opening. */}
        <group ref={jawL} position={[-(boxW * 0.5 + 0.05), -0.05, 0]}>
          <mesh position={[0, -0.19, 0]}>
            <boxGeometry args={[0.075, 0.38, boxD * 0.7]} />
            <meshStandardMaterial color="#c7cede" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0.055, -0.36, 0]}>
            <boxGeometry args={[0.15, 0.075, boxD * 0.7]} />
            <meshStandardMaterial color="#c7cede" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
        <group ref={jawR} position={[boxW * 0.5 + 0.05, -0.05, 0]}>
          <mesh position={[0, -0.19, 0]}>
            <boxGeometry args={[0.075, 0.38, boxD * 0.7]} />
            <meshStandardMaterial color="#c7cede" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[-0.055, -0.36, 0]}>
            <boxGeometry args={[0.15, 0.075, boxD * 0.7]} />
            <meshStandardMaterial color="#c7cede" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* Value boxes */}
      {ids.map((id) => (
        <group
          key={id}
          ref={(el) => {
            groups.current[id] = el;
          }}
          position={[xOfPos(frame.posOf[id]), 0, 0]}
        >
          <mesh
            ref={(el) => {
              meshes.current[id] = el;
            }}
          >
            <boxGeometry args={[boxW, 1, boxD]} />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[id] = el;
              }}
              metalness={0.35}
              roughness={0.45}
            />
          </mesh>
          {showLabels && (
            <mesh
              ref={(el) => {
                labels.current[id] = el;
              }}
              position={[0, 0.5, boxD / 2 + 0.012]}
            >
              <planeGeometry args={[boxW * 0.72, boxW * 0.72]} />
              <meshBasicMaterial map={labelTex(Math.round(frame.heights[id]))} transparent />
            </mesh>
          )}
        </group>
      ))}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={WORLD_W + 4}
        blur={2.4}
        far={5}
      />
      <CameraRig reduced={reduced} done={done} />
    </>
  );
}

/** Fixed 3/4 framing with a whisper of pointer parallax (off for reduced motion). */
function CameraRig({ reduced, done }: { reduced: boolean; done: boolean }) {
  useFrame(({ camera, pointer, clock }) => {
    if (reduced) {
      camera.position.set(0, 3.5, 10.2);
    } else {
      const bob = done ? Math.sin(clock.getElapsedTime() * 1.5) * 0.1 : 0;
      camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.03;
      camera.position.y += (3.5 + bob + pointer.y * 0.35 - camera.position.y) * 0.03;
      camera.position.z += (10.2 - camera.position.z) * 0.05;
    }
    camera.lookAt(0, 2, 0);
  });
  return null;
}

interface Props {
  frame: Frame;
  steps: readonly Step[];
  speed: number;
  status: PlaybackStatus;
  statusLabel: string;
  algorithmKey: AlgorithmKey;
  /** Sets the array size — used by the over-cap "Shrink" button. */
  onShrink: (n: number) => void;
}

export function CraneView({
  frame,
  steps,
  speed,
  status,
  statusLabel,
  algorithmKey,
  onShrink,
}: Props) {
  const algorithm = getAlgorithm(algorithmKey);
  const n = frame.heights.length;
  const step = frame.index > 0 ? steps[frame.index - 1] : undefined;
  const done = status === 'done';

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** The floating action label under the rig (PLAN §FC3). */
  const action = useMemo(() => {
    if (!step) return null;
    switch (step.type) {
      case 'compare':
        return { text: `a[${step.i}] > a[${step.j}] ?`, tone: 'text-bar-comparing' };
      case 'swap':
        return { text: `swap a[${step.i}], a[${step.j}]`, tone: 'text-bar-swapping' };
      case 'overwrite':
        return { text: `write ${step.value} → a[${step.index}]`, tone: 'text-bar-overwriting' };
      case 'markPivot':
        return { text: `pivot = a[${step.index}]`, tone: 'text-bar-pivot' };
      default:
        return null;
    }
  }, [step]);

  const lines = PSEUDOCODE[algorithmKey];
  const activeLine = step?.line;

  if (n > CRANE_MAX) {
    return (
      <section
        aria-label="Sorting visualization"
        className="relative flex min-h-[300px] flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-subtle bg-canvas p-8 text-center shadow-e1 lg:min-h-0"
      >
        <p className="sr-only" aria-live="polite">
          {statusLabel}
        </p>
        <h3 className="font-display text-2xl italic text-primary">
          The 3D Crane is clearest with ≤ 20 boxes
        </h3>
        <p className="max-w-md text-sm font-light leading-snug text-secondary">
          You have {n} values. A physical crane can only stage a small shelf legibly — switch to
          Columns for the full array, or shrink to a demo-sized set.
        </p>
        <button
          type="button"
          onClick={() => onShrink(16)}
          className="rounded-full border border-strong px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-fast hover:border-accent hover:text-accent"
        >
          Shrink to 16 boxes
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label="Sorting visualization"
      className="relative flex min-h-[440px] flex-1 flex-col overflow-hidden rounded-lg border border-subtle bg-canvas shadow-e1"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>

      {/* Complexity pills */}
      <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex flex-wrap justify-center gap-2 px-3">
        <span className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1 font-mono text-[11px] text-accent shadow-[var(--glow-accent)]">
          TIME <strong className="font-semibold">{algorithm.complexity.average}</strong>
          <span className="ml-1 text-muted">avg</span>
        </span>
        <span className="rounded-full border border-lime/40 bg-lime-soft px-3 py-1 font-mono text-[11px] text-lime shadow-[var(--glow-lime)]">
          SPACE <strong className="font-semibold">{algorithm.complexity.space}</strong>
        </span>
      </div>

      <div className="relative min-h-[280px] flex-1">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 3.5, 10.2], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          // Measure immediately. With r3f's default 200ms debounce, toggling
          // view modes faster than that drops the pending measurement and the
          // canvas is left at its unsized 300x150 default, rendering nothing.
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        >
          <CraneScene
            frame={frame}
            step={step}
            snap={speed >= SNAP_SPEED}
            reduced={reduced}
            done={done}
            stepMs={1000 / Math.max(0.05, speed)}
            playing={status === 'playing'}
          />
        </Canvas>

        {/* Action label / completion flourish */}
        <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center px-3">
          {done ? (
            <span className="rounded-full border border-lime/50 bg-lime-soft px-4 py-1.5 font-mono text-sm text-lime">
              Sorted!
            </span>
          ) : action ? (
            <span
              className={`rounded-full bg-surface-1/80 px-4 py-1.5 font-mono text-sm ${action.tone}`}
            >
              {action.text}
            </span>
          ) : null}
        </div>
      </div>

      {/* Synced pseudocode, current line highlighted in lock-step */}
      <div className="max-h-[168px] overflow-y-auto border-t border-subtle bg-surface-1/70 px-3 py-2">
        <ol className="font-mono text-[11px] leading-[1.7] text-secondary">
          {lines.map((ln, i) => {
            const active = i === activeLine;
            return (
              <li
                key={i}
                className={`flex gap-3 rounded px-1 ${active ? 'bg-lime-soft text-primary' : ''}`}
              >
                <span className={active ? 'text-lime' : 'text-muted'}>
                  {String(i + 1).padStart(2, ' ')}
                </span>
                <span style={{ paddingLeft: `${ln.indent * 1.1}rem` }}>{ln.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
