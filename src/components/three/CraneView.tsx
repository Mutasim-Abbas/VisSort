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
const BOX_H_MAX = 3.2;
const RAIL_Y = 4.25;
const CLAW_PARK_Y = 3.6;
/** Peak height of the carry arc, above the taller of the two boxes. */
const LIFT = 1.15;

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
}

/** Per-box interpolation state, kept out of React so useFrame can mutate it. */
interface Motion {
  curX: number[];
  fromX: number[];
  tgtX: number[];
  curH: number[];
  lift: number[];
}

function CraneScene({ frame, step, snap, reduced, done }: SceneProps) {
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

  // Reallocate interpolation state whenever the array size changes.
  const motion = useRef<Motion>({ curX: [], fromX: [], tgtX: [], curH: [], lift: [] });
  const sizeKey = `${n}:${maxValue}`;
  const lastSize = useRef('');
  if (lastSize.current !== sizeKey) {
    lastSize.current = sizeKey;
    const m: Motion = { curX: [], fromX: [], tgtX: [], curH: [], lift: [] };
    for (let id = 0; id < n; id++) {
      const x = xOfPos(frame.posOf[id]);
      m.curX[id] = x;
      m.fromX[id] = x;
      m.tgtX[id] = x;
      m.curH[id] = hOfValue(frame.heights[id]);
      m.lift[id] = 0;
    }
    motion.current = m;
  }

  const clawX = useRef(0);
  const clawY = useRef(CLAW_PARK_Y);

  useFrame((_, delta) => {
    const m = motion.current;
    // Frame-rate independent smoothing; `snap`/reduced-motion jump straight there.
    const instant = snap || reduced;
    const k = instant ? 1 : 1 - Math.exp(-12 * Math.min(delta, 0.05));

    let carryX: number | null = null;
    let carryTop = 0;
    let maxLift = 0;

    for (let id = 0; id < n; id++) {
      const tgtX = xOfPos(frame.posOf[id]);
      if (tgtX !== m.tgtX[id]) {
        m.fromX[id] = m.curX[id];
        m.tgtX[id] = tgtX;
      }
      m.curX[id] += (tgtX - m.curX[id]) * k;
      if (Math.abs(tgtX - m.curX[id]) < 0.0015) m.curX[id] = tgtX;

      const tgtH = hOfValue(frame.heights[id]);
      m.curH[id] += (tgtH - m.curH[id]) * k;

      // Carry arc: peaks halfway through the travel, scaled by how far it goes.
      // Only the box travelling RIGHT is lifted — its partner slides along the
      // shelf beneath it. Lifting both would make them pass through each other.
      const span = Math.abs(m.tgtX[id] - m.fromX[id]);
      const carried = m.tgtX[id] > m.fromX[id];
      let lift = 0;
      if (!instant && carried && span > 0.001) {
        const p = Math.min(1, Math.abs(m.curX[id] - m.fromX[id]) / span);
        lift = Math.sin(Math.PI * p) * LIFT * Math.min(1, span / Math.max(slot, 0.001));
      }
      m.lift[id] = lift;
      if (lift > maxLift) {
        maxLift = lift;
        carryX = m.curX[id];
        carryTop = lift + m.curH[id];
      }

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
        const cf = instant || !mat.userData.tinted ? 1 : 0.22;
        mat.userData.tinted = true;
        mat.color.lerp(target, cf);
        mat.emissive.lerp(target, cf);
        mat.emissiveIntensity = EMISSIVE[state] ?? EMISSIVE.default;
      }
    }

    // Claw: rides the box it is carrying, else hovers over the compared pair.
    let targetClawX = clawX.current;
    let targetClawY = CLAW_PARK_Y;
    if (carryX !== null) {
      targetClawX = carryX;
      targetClawY = carryTop + 0.42;
    } else if (step && !instant) {
      if (step.type === 'compare') {
        targetClawX = (xOfPos(step.i) + xOfPos(step.j)) / 2;
        targetClawY = CLAW_PARK_Y - 0.35;
      } else if (step.type === 'overwrite') {
        targetClawX = xOfPos(step.index);
        const id = frame.posOf.findIndex((p) => p === step.index);
        targetClawY = (id >= 0 ? m.curH[id] : 1) + 0.5;
      } else if (step.type === 'markPivot') {
        targetClawX = xOfPos(step.index);
      }
    }
    const ck = instant ? 1 : 1 - Math.exp(-9 * Math.min(delta, 0.05));
    clawX.current += (targetClawX - clawX.current) * ck;
    clawY.current += (targetClawY - clawY.current) * ck;

    if (trolley.current) trolley.current.position.x = clawX.current;
    if (clawGroup.current) {
      clawGroup.current.position.x = clawX.current;
      clawGroup.current.position.y = clawY.current;
    }
    if (strap.current) {
      const len = Math.max(0.01, RAIL_Y - clawY.current);
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
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * boxW * 0.46, -0.2, 0]}>
            <boxGeometry args={[0.07, 0.34, boxD * 0.7]} />
            <meshStandardMaterial color="#c7cede" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
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
      camera.position.set(0, 3.2, 9.4);
    } else {
      const bob = done ? Math.sin(clock.getElapsedTime() * 1.5) * 0.1 : 0;
      camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.03;
      camera.position.y += (3.2 + bob + pointer.y * 0.35 - camera.position.y) * 0.03;
      camera.position.z += (9.4 - camera.position.z) * 0.05;
    }
    camera.lookAt(0, 1.75, 0);
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
          camera={{ position: [0, 3.2, 9.4], fov: 40 }}
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
