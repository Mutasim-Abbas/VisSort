import { useRef, type CSSProperties } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The Home-page hero: a row of 3D bars with a lime "sorted" sweep travelling
 * across them, lit in the VisSort palette, with the camera gently following the
 * pointer for parallax depth. Pure decoration — the real algorithms live on the
 * Visualizer page.
 */

const COLORS = {
  default: new THREE.Color('#4a5468'),
  comparing: new THREE.Color('#f5c518'),
  sorted: new THREE.Color('#8ce046'),
};

const BAR_COUNT = 24;
const SWEEP_SPEED = 2.4;

function Bar({ index, height }: { index: number; height: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const x = (index - (BAR_COUNT - 1) / 2) * 0.5;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const period = BAR_COUNT + 8;
    const sweep = (t * SWEEP_SPEED) % period;
    const bob = Math.sin(t * 1.6 + index * 0.45) * 0.05;
    const h = height + bob;
    if (mesh.current) {
      mesh.current.scale.y = h;
      mesh.current.position.y = h / 2;
    }
    if (mat.current) {
      const head = Math.floor(sweep);
      let target = COLORS.default;
      let emissive = 0.06;
      if (index < head) {
        target = COLORS.sorted;
        emissive = 0.35;
      }
      if (index === head) {
        target = COLORS.comparing;
        emissive = 0.7;
      }
      mat.current.color.lerp(target, 0.15);
      mat.current.emissive.lerp(target, 0.15);
      mat.current.emissiveIntensity = emissive;
    }
  });

  return (
    <mesh ref={mesh} position={[x, height / 2, 0]} scale={[1, height, 1]} castShadow>
      <boxGeometry args={[0.32, 1, 0.32]} />
      <meshStandardMaterial ref={mat} metalness={0.35} roughness={0.35} />
    </mesh>
  );
}

function Rig() {
  useFrame((state) => {
    const { pointer, camera } = state;
    // Scroll pulls the camera up and back — the hero recedes cinematically
    // as the visitor moves toward the content below.
    const scroll = typeof window === 'undefined' ? 0 : window.scrollY;
    const back = Math.min(scroll * 0.014, 10);
    const rise = Math.min(scroll * 0.006, 4);
    camera.position.x += (pointer.x * 2.4 - camera.position.x) * 0.04;
    camera.position.y += (3.1 + rise + pointer.y * 0.8 - camera.position.y) * 0.04;
    camera.position.z += (9 + back - camera.position.z) * 0.05;
    camera.lookAt(0, 1.1, 0);
  });
  return null;
}

function Bars() {
  const heights = Array.from({ length: BAR_COUNT }, (_, i) => 0.7 + (i / (BAR_COUNT - 1)) * 2.4);
  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.25}>
      {heights.map((h, i) => (
        <Bar key={i} index={i} height={h} />
      ))}
    </Float>
  );
}

export function HeroScene({ style }: { style?: CSSProperties }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 3.1, 9], fov: 42 }}
      style={style}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
      <pointLight position={[-6, 3, 2]} intensity={40} color="#f5b417" distance={20} />
      <pointLight position={[6, 2, 3]} intensity={30} color="#8ce046" distance={20} />
      <Bars />
      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#1e2331"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#333c52"
        fadeDistance={26}
        fadeStrength={1.4}
        infiniteGrid
      />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2.2} far={6} />
      <Rig />
    </Canvas>
  );
}
