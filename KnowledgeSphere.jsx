import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Generate points on sphere surface using Fibonacci sphere algorithm
function fibonacciSphere(samples = 50) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2; // Range from 1 to -1
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

// Find nearest neighbors for each point
function findConnections(points, maxConnections = 4, maxDistance = 0.6) {
  const connections = [];

  points.forEach((point, i) => {
    const distances = points
      .map((p, j) => ({ index: j, distance: point.distanceTo(p) }))
      .filter(d => d.index !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxConnections)
      .filter(d => d.distance < maxDistance);

    distances.forEach(d => {
      if (i < d.index) { // Avoid duplicate connections
        connections.push([i, d.index]);
      }
    });
  });

  return connections;
}

function NetworkSphere() {
  const sphereRef = useRef();
  const pointsRef = useRef();
  const linesRef = useRef();

  // Generate points and connections
  const { points, connections } = useMemo(() => {
    const pts = fibonacciSphere(60); // 60 points for good distribution
    const conns = findConnections(pts, 5, 0.7);
    return { points: pts, connections: conns };
  }, []);

  // Create line geometry
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    connections.forEach(([i, j]) => {
      const p1 = points[i];
      const p2 = points[j];

      positions.push(p1.x * 2, p1.y * 2, p1.z * 2);
      positions.push(p2.x * 2, p2.y * 2, p2.z * 2);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [points, connections]);

  // Create point positions
  const pointPositions = useMemo(() => {
    return points.map(p => [p.x * 2, p.y * 2, p.z * 2]);
  }, [points]);

  // Animate rotation
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Slow rotation
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.15;
      sphereRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.15;
      pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }

    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.15;
      linesRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
  });

  return (
    <group>
      {/* Main semi-transparent sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={0.15}
          wireframe={false}
          emissive="#a855f7"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[2.01, 16, 16]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.1}
          wireframe={true}
        />
      </mesh>

      {/* Connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.6}
          linewidth={2}
        />
      </lineSegments>

      {/* Points on sphere */}
      <group ref={pointsRef}>
        {pointPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color="#ec4899"
              emissive="#a855f7"
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient glow effect */}
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#7c3aed" />
    </group>
  );
}

export default function KnowledgeSphere() {
  return (
    <div style={{ width: '400px', height: '400px', margin: '0 auto' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#7c3aed" />

        {/* The network sphere */}
        <NetworkSphere />

        {/* Controls - no zoom or pan */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
