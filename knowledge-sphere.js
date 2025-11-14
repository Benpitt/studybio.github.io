// Knowledge Sphere - React Three Fiber Component
// Uses CDN imports for React, Three.js, and React Three Fiber

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Generate points on sphere surface using Fibonacci sphere algorithm for even distribution
function fibonacciSphere(samples = 50) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2; // Y ranges from 1 to -1
    const radius = Math.sqrt(1 - y * y); // Radius at y
    const theta = phi * i; // Golden angle increment

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

// Find nearest neighbors for network connections
function findConnections(points, maxConnections = 5, maxDistance = 0.7) {
  const connections = [];

  points.forEach((point, i) => {
    const distances = points
      .map((p, j) => ({ index: j, distance: point.distanceTo(p) }))
      .filter(d => d.index !== i && d.distance < maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxConnections);

    distances.forEach(d => {
      // Only add if i < d.index to avoid duplicate connections
      if (i < d.index) {
        connections.push([i, d.index]);
      }
    });
  });

  return connections;
}

// Animated Network Sphere Component
function NetworkSphere() {
  const groupRef = useRef();
  const linesRef = useRef();
  const glowRef = useRef();

  // Generate points and connections (memoized for performance)
  const { points, connections } = useMemo(() => {
    const pts = fibonacciSphere(55); // 55 points for good coverage
    const conns = findConnections(pts, 5, 0.7);
    return { points: pts, connections: conns };
  }, []);

  // Create line segments geometry
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    connections.forEach(([i, j]) => {
      const p1 = points[i];
      const p2 = points[j];

      positions.push(p1.x * 2.2, p1.y * 2.2, p1.z * 2.2);
      positions.push(p2.x * 2.2, p2.y * 2.2, p2.z * 2.2);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [points, connections]);

  // Point positions scaled to sphere radius
  const pointPositions = useMemo(() => {
    return points.map(p => [p.x * 2.2, p.y * 2.2, p.z * 2.2]);
  }, [points]);

  // Animation loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Smooth rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.12;
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.15 + 0.1;
    }

    // Subtle pulsing glow
    if (glowRef.current) {
      const pulse = Math.sin(time * 0.8) * 0.1 + 0.15;
      glowRef.current.material.opacity = pulse;
    }

    // Animate line opacity for neural effect
    if (linesRef.current) {
      const linePulse = Math.sin(time * 1.2) * 0.15 + 0.5;
      linesRef.current.material.opacity = linePulse;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main semi-transparent sphere shell */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          emissive="#a855f7"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Subtle wireframe */}
      <mesh>
        <sphereGeometry args={[2.21, 20, 20]} />
        <meshBasicMaterial
          color="#ec4899"
          transparent
          opacity={0.08}
          wireframe={true}
        />
      </mesh>

      {/* Neural network connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.5}
          linewidth={1}
        />
      </lineSegments>

      {/* Glowing nodes on sphere surface */}
      {pointPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={2}
            transparent
            opacity={0.95}
          />
          {/* Point glow */}
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={0.3}
            />
          </mesh>
        </mesh>
      ))}

      {/* Central glow light */}
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#7c3aed" distance={8} />
    </group>
  );
}

// Main Component
export default function KnowledgeSphere({ style }) {
  return (
    <div style={style || { width: '400px', height: '400px', margin: '0 auto' }} className="knowledge-sphere-container">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
        dpr={[1, 2]} // Adaptive pixel ratio for performance
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
        <directionalLight position={[-3, -3, -3]} intensity={0.3} color="#7c3aed" />
        <hemisphereLight args={['#7c3aed', '#4c1d95', 0.4]} />

        {/* The network sphere */}
        <React.Suspense fallback={null}>
          <NetworkSphere />
        </React.Suspense>

        {/* Interactive controls - rotation only */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.4}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
