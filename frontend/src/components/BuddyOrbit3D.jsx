import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BuddyOrbit3D({ candidates = [], onSelectCandidate }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 350;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 80, 180);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Center Core (Me / Current User)
    const centerGeo = new THREE.SphereGeometry(18, 32, 32);
    const centerMat = new THREE.MeshPhongMaterial({
      color: 0xf97316,
      emissive: 0xe11d48,
      specular: 0xffffff,
      shininess: 80,
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    scene.add(centerMesh);

    // Outer Orbit Ring
    const orbitRingGeo = new THREE.RingGeometry(68, 70, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    // Secondary Inner Orbit Ring
    const innerRingGeo = new THREE.RingGeometry(44, 45, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    scene.add(innerRing);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const light1 = new THREE.PointLight(0xf97316, 2, 300);
    light1.position.set(100, 100, 100);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x06b6d4, 1.5, 300);
    light2.position.set(-100, -100, -100);
    scene.add(light2);

    // Orbiting Candidate Nodes
    const orbitNodes = [];
    const radius = 70;
    const numCandidates = candidates.length > 0 ? candidates.length : 5;

    for (let i = 0; i < numCandidates; i++) {
      const angle = (i / numCandidates) * Math.PI * 2;

      const nodeGroup = new THREE.Group();

      // Node Sphere
      const nodeGeo = new THREE.SphereGeometry(10, 24, 24);
      const color = i % 2 === 0 ? 0x06b6d4 : 0xec4899;
      const nodeMat = new THREE.MeshPhongMaterial({
        color,
        emissive: 0x1e1b4b,
        shininess: 60,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeGroup.add(nodeMesh);

      // Node Halo Ring
      const haloGeo = new THREE.RingGeometry(12, 14, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      nodeGroup.add(haloMesh);

      scene.add(nodeGroup);

      orbitNodes.push({
        group: nodeGroup,
        baseAngle: angle,
        candidateData: candidates[i] || null,
      });
    }

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Center spin & pulse
      centerMesh.rotation.y = t * 0.5;
      const scaleFactor = 1 + Math.sin(t * 2) * 0.05;
      centerMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Orbit movement
      orbitNodes.forEach((node) => {
        const currentAngle = node.baseAngle + t * 0.25;
        node.group.position.x = Math.cos(currentAngle) * radius;
        node.group.position.z = Math.sin(currentAngle) * radius;
        node.group.position.y = Math.sin(currentAngle * 2) * 8; // gentle float

        node.group.rotation.y = t * 0.8;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [candidates]);

  return (
    <div className="buddy-orbit-3d-wrapper" style={{ width: '100%', position: 'relative' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '320px',
          background: 'radial-gradient(circle at center, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0) 70%)',
          borderRadius: '24px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.82rem',
          color: '#94a3b8',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '4px 14px',
          borderRadius: '20px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        ✨ Interactive 3D Match Radar • Real-time Affinity Orbit
      </div>
    </div>
  );
}
