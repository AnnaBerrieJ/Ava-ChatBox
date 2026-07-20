"use client";

// components/AvatarScene.tsx
// Loaded dynamically (no SSR) — do not import directly, use AvatarViewer.tsx

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

// Ready Player Me viseme morph target names (for lip sync)
const VISEMES = [
  "viseme_sil","viseme_PP","viseme_FF","viseme_TH","viseme_DD",
  "viseme_kk","viseme_CH","viseme_SS","viseme_nn","viseme_RR",
  "viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U",
];

// Expression morph target names used by Ready Player Me
const EXPR_TARGETS: Record<string, string[]> = {
  happy:    ["mouthSmile","browInnerUp","cheekPuff"],
  thinking: ["browDownLeft","browDownRight","eyeLookUpLeft","eyeLookUpRight"],
  idle:     [],
};

type Expression = "idle" | "happy" | "thinking";

// ─── 3D Model Component ───────────────────────────────────────────────────────
function AvatarModel({
  url,
  isTalking,
  expression,
}: {
  url: string;
  isTalking: boolean;
  expression: Expression;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  // Timers
  const visemeTimer = useRef(0);
  const blinkTimer  = useRef(0);
  const isBlinking  = useRef(false);

  // Enable shadows on meshes
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
  }, [scene]);

  // Helper: set a morph target value on all head meshes
  const setMorph = (name: string, value: number) => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = value;
        }
      }
    });
  };

  const lerpMorph = (name: string, target: number, speed: number) => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
            mesh.morphTargetInfluences[idx],
            target,
            speed
          );
        }
      }
    });
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // ── Idle body sway ──
    group.current.rotation.y = Math.sin(t * 0.25) * 0.06;

    // ── Breathing ──
    scene.traverse((obj) => {
      if (obj.name.toLowerCase().includes("spine") || obj.name.toLowerCase().includes("chest")) {
        obj.rotation.x = Math.sin(t * 0.9) * 0.01;
      }

      // ── Head movement ──
      if (obj.name === "Head" || obj.name === "head") {
        obj.rotation.x = Math.sin(t * 0.4) * 0.025 + (isTalking ? Math.sin(t * 7) * 0.03 : 0);
        obj.rotation.z = Math.sin(t * 0.35) * 0.02;
      }

      // ── Arm gentle sway ──
      if (obj.name === "LeftArm")  obj.rotation.z =  Math.sin(t * 0.5) * 0.04 + 0.1;
      if (obj.name === "RightArm") obj.rotation.z = -Math.sin(t * 0.5) * 0.04 - 0.1;

      // ── Hand idle ──
      if (obj.name === "LeftHand")  obj.rotation.z =  Math.sin(t * 0.6) * 0.05;
      if (obj.name === "RightHand") obj.rotation.z = -Math.sin(t * 0.6) * 0.05;
    });

    // ── Lip sync ──
    visemeTimer.current += delta;
    if (isTalking && visemeTimer.current > 0.08) {
      visemeTimer.current = 0;
      VISEMES.forEach((v) => setMorph(v, 0));
      const v = VISEMES[Math.floor(Math.random() * VISEMES.length)];
      setMorph(v, Math.random() * 0.7 + 0.3);
    } else if (!isTalking) {
      VISEMES.forEach((v) => lerpMorph(v, 0, 0.15));
    }

    // ── Expressions ──
    // First clear all expression targets
    Object.values(EXPR_TARGETS).flat().forEach((t) => lerpMorph(t, 0, 0.04));
    // Then apply the active one
    (EXPR_TARGETS[expression] ?? []).forEach((t) => lerpMorph(t, 0.8, 0.04));

    // ── Eye blink ──
    blinkTimer.current += delta;
    if (!isBlinking.current && blinkTimer.current > (Math.random() * 3 + 2)) {
      isBlinking.current = true;
      blinkTimer.current = 0;
    }
    if (isBlinking.current) {
      const bv = blinkTimer.current < 0.06 ? blinkTimer.current / 0.06
        : blinkTimer.current < 0.12 ? 1 - (blinkTimer.current - 0.06) / 0.06
        : 0;
      setMorph("eyeBlinkLeft",  bv);
      setMorph("eyeBlinkRight", bv);
      if (blinkTimer.current >= 0.12) isBlinking.current = false;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]} scale={1}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────
export default function AvatarScene({
  avatarUrl,
  isTalking,
  expression = "idle",
}: {
  avatarUrl: string;
  isTalking: boolean;
  expression?: Expression;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 1.8], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      shadows
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.8} castShadow />
      <pointLight position={[-2, 2, 0]} intensity={0.6} color="#00d4ff" />
      <pointLight position={[ 2, 0, 0]} intensity={0.4} color="#ffd700" />

      <Suspense fallback={null}>
        <AvatarModel url={avatarUrl} isTalking={isTalking} expression={expression} />
        <Environment preset="sunset" />
        <ContactShadows
          position={[0, -1.05, 0]}
          opacity={0.5}
          scale={3}
          blur={2.5}
        />
      </Suspense>

      {/* Subtle orbit — allows user to rotate avatar */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={ Math.PI / 5}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
