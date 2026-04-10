"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const pointer = { nx: 0, ny: 0 };

function usePointerParallax() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

function SoftShapes({ paused }: { paused: boolean }) {
  const root = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Group>(null);
  usePointerParallax();

  useFrame((state) => {
    if (paused || !root.current) return;
    const t = state.clock.elapsedTime;
    const mx = pointer.nx * 0.28;
    const my = pointer.ny * 0.22;
    root.current.rotation.set(
      my * 0.12 + Math.sin(t * 0.32) * 0.06,
      t * 0.11 + mx * 0.16,
      Math.cos(t * 0.24) * 0.035,
    );
    if (wire.current) {
      wire.current.rotation.y = -t * 0.07;
      wire.current.rotation.x = mx * 0.08;
    }
  });

  return (
    <group ref={root}>
      <mesh>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      <group ref={wire} scale={1.55}>
        <mesh>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.065}
            wireframe
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh rotation={[0.4, 0.7, 0.2]}>
        <torusGeometry args={[1.35, 0.018, 12, 64]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.09} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function HeroThreeBackdrop() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    setReady(true);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!ready || reducedMotion) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[min(92%,480px)] opacity-45 dark:opacity-35 md:w-[min(55%,520px)] md:opacity-55 lg:opacity-60"
      aria-hidden
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.2], fov: 40 }}
        className="h-full w-full"
      >
        <SoftShapes paused={false} />
      </Canvas>
    </div>
  );
}
