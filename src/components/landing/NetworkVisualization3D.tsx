import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// Node positions in 3D space
const nodePositions: [number, number, number][] = [
  [0, 0, 0],
  [1.8, 1.2, -0.5],
  [-1.5, 1.5, 0.3],
  [-1.8, -1.0, -0.4],
  [1.6, -1.3, 0.6],
  [0.5, 2.2, -0.8],
  [-0.8, -2.0, 0.5],
  [2.5, 0, -0.3],
  [-2.3, 0.3, 0.2],
  [0, -0.5, 1.2],
  [1.0, 0.5, -1.0],
  [-0.5, 1.0, 0.8],
];

const connections: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 9],
  [1, 5], [1, 7], [1, 10],
  [2, 5], [2, 8], [2, 11],
  [3, 6], [3, 8],
  [4, 6], [4, 7],
  [5, 11], [9, 10],
];

function GlowingNode({ position, size = 0.12, color = "#5B7CFA", delay = 0 }: {
  position: [number, number, number];
  size?: number;
  color?: string;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + delay;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.08;
      meshRef.current.position.x = position[0] + Math.cos(t * 0.3) * 0.04;
    }
    if (glowRef.current) {
      glowRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.08;
      glowRef.current.position.x = position[0] + Math.cos(t * 0.3) * 0.04;
      const scale = hovered ? 1.8 : 1.3 + Math.sin(t * 1.2) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Glow sphere */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[size * 1.8, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.25 : 0.12} />
      </mesh>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 1 : 0.85} />
      </mesh>
    </group>
  );
}

function ConnectionLine({ start, end, color = "#5B7CFA" }: {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
    geo.setFromPoints(points);
    return geo;
  }, [start, end]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.15 + Math.sin(clock.getElapsedTime() * 0.8) * 0.08;
    }
  });

  return (
    <line ref={lineRef as any} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.2} />
    </line>
  );
}

function FloatingParticles({ count = 40 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sz[i] = Math.random() * 0.03 + 0.01;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
      const t = clock.getElapsedTime();
      for (let i = 0; i < count; i++) {
        posArray[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.001;
        posArray[i * 3] += Math.cos(t * 0.2 + i * 0.5) * 0.0005;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#5B7CFA"
        size={0.04}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

const nodeColors = [
  "#5B7CFA", "#7C5BFA", "#5BAFFA", "#5BFA8C", "#FA5B7C",
  "#5B7CFA", "#7C5BFA", "#5BAFFA", "#5BFA8C", "#5B7CFA",
  "#7C5BFA", "#5BAFFA",
];

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.15;
      groupRef.current.rotation.x = Math.cos(clock.getElapsedTime() * 0.08) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      {connections.map(([a, b], i) => (
        <ConnectionLine
          key={`line-${i}`}
          start={nodePositions[a]}
          end={nodePositions[b]}
          color={nodeColors[a]}
        />
      ))}

      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <Float key={`node-${i}`} speed={0.8} rotationIntensity={0} floatIntensity={0.3}>
          <GlowingNode
            position={pos}
            size={i === 0 ? 0.18 : 0.1 + Math.random() * 0.06}
            color={nodeColors[i]}
            delay={i * 0.7}
          />
        </Float>
      ))}

      {/* Particles */}
      <FloatingParticles count={50} />
    </group>
  );
}

export default function NetworkVisualization3D() {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[440px]">
      {/* Soft radial glow behind the canvas */}
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--soft-blue)/0.08),transparent)]" />
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <NetworkScene />
      </Canvas>
    </div>
  );
}
