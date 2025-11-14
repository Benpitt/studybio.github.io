// Knowledge Sphere - Vanilla Three.js (no React, no build step)
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/controls/OrbitControls.js';

// Fibonacci sphere algorithm for even point distribution
function fibonacciSphere(samples = 55) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

// Find nearest neighbors for connections
function findConnections(points, maxConnections = 5, maxDistance = 0.7) {
  const connections = [];

  points.forEach((point, i) => {
    const distances = points
      .map((p, j) => ({ index: j, distance: point.distanceTo(p) }))
      .filter(d => d.index !== i && d.distance < maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxConnections);

    distances.forEach(d => {
      if (i < d.index) {
        connections.push([i, d.index]);
      }
    });
  });

  return connections;
}

export function initKnowledgeSphere(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.offsetWidth || 400;
  const height = container.offsetHeight || 400;

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 7);

  // Renderer with optimizations
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight1.position.set(5, 5, 5);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0x7c3aed, 0.3);
  directionalLight2.position.set(-3, -3, -3);
  scene.add(directionalLight2);

  const hemisphereLight = new THREE.HemisphereLight(0x7c3aed, 0x4c1d95, 0.4);
  scene.add(hemisphereLight);

  const pointLight = new THREE.PointLight(0x7c3aed, 0.8, 8);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // Main sphere group
  const sphereGroup = new THREE.Group();
  scene.add(sphereGroup);

  // 1. Semi-transparent main sphere
  const mainSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      emissive: 0xa855f7,
      emissiveIntensity: 0.25
    })
  );
  sphereGroup.add(mainSphere);

  // 2. Outer glow sphere
  const glowSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    })
  );
  sphereGroup.add(glowSphere);

  // 3. Wireframe overlay
  const wireframeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.21, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.08,
      wireframe: true
    })
  );
  sphereGroup.add(wireframeSphere);

  // Generate points and connections
  const points = fibonacciSphere(55);
  const connections = findConnections(points, 5, 0.7);

  // 4. Connection lines
  const linePositions = [];
  connections.forEach(([i, j]) => {
    const p1 = points[i];
    const p2 = points[j];
    linePositions.push(p1.x * 2.2, p1.y * 2.2, p1.z * 2.2);
    linePositions.push(p2.x * 2.2, p2.y * 2.2, p2.z * 2.2);
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.5
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  sphereGroup.add(lines);

  // 5. Glowing nodes
  points.forEach(p => {
    const nodeGroup = new THREE.Group();

    // Main node
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xec4899,
        emissive: 0xec4899,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.95
      })
    );
    nodeGroup.add(node);

    // Node glow
    const nodeGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.3
      })
    );
    nodeGroup.add(nodeGlow);

    nodeGroup.position.set(p.x * 2.2, p.y * 2.2, p.z * 2.2);
    sphereGroup.add(nodeGroup);
  });

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.rotateSpeed = 0.4;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 1.3;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Animation loop
  let animationId;
  function animate() {
    animationId = requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Smooth rotation
    sphereGroup.rotation.y = time * 0.12;
    sphereGroup.rotation.x = Math.sin(time * 0.08) * 0.15 + 0.1;

    // Pulsing glow
    const pulse = Math.sin(time * 0.8) * 0.1 + 0.15;
    glowSphere.material.opacity = pulse;

    // Animate line opacity
    const linePulse = Math.sin(time * 1.2) * 0.15 + 0.5;
    lines.material.opacity = linePulse;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Handle resize
  function handleResize() {
    const newWidth = container.offsetWidth || 400;
    const newHeight = container.offsetHeight || 400;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }

  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
