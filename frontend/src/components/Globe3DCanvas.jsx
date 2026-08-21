import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe3DCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xff7700, 1.8);
    dirLight1.position.set(100, 100, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0088ff, 1.5);
    dirLight2.position.set(-100, -100, -100);
    scene.add(dirLight2);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Core Sphere
    const sphereGeo = new THREE.SphereGeometry(60, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x1e1b4b,
      specular: 0xff8800,
      shininess: 40,
      transparent: true,
      opacity: 0.92,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(coreSphere);

    // Wireframe Outer Mesh
    const wireGeo = new THREE.SphereGeometry(61.5, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // Outer Atmosphere Glow Ring
    const atmosphereGeo = new THREE.SphereGeometry(68, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const atmosphereSphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereSphere);

    // Cities / State markers
    const cities = [
      { name: 'Delhi', lat: 28.6139, lon: 77.209, color: 0xff4500 },
      { name: 'Mumbai', lat: 19.076, lon: 72.8777, color: 0x00f0ff },
      { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, color: 0x10b981 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707, color: 0xf59e0b },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639, color: 0xec4899 },
      { name: 'Hyderabad', lat: 17.385, lon: 78.4867, color: 0x8b5cf6 },
      { name: 'Jaipur', lat: 26.9124, lon: 75.7873, color: 0xffaa00 },
    ];

    function latLonToVector3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    const cityNodes = [];
    cities.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, 61);

      // Glowing pin sphere
      const pinGeo = new THREE.SphereGeometry(2.5, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: city.color });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      globeGroup.add(pinMesh);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(3, 4.5, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: city.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ringMesh);

      cityNodes.push({ pinMesh, ringMesh, pos });
    });

    // Connection Arcs between cities
    for (let i = 0; i < cityNodes.length - 1; i++) {
      const start = cityNodes[i].pos;
      const end = cityNodes[i + 1].pos;

      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(85); // Curve outwards in 3D

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(30);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.6,
      });
      const curveLine = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(curveLine);
    }

    // 3D Star Particle Field
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 350;
      positions[i + 1] = (Math.random() - 0.5) * 350;
      positions[i + 2] = (Math.random() - 0.5) * 350;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xf87171,
      size: 1.8,
      transparent: true,
      opacity: 0.7,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Mouse Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.008;
      globeGroup.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!isDragging) {
        globeGroup.rotation.y += 0.004;
        wireSphere.rotation.y -= 0.002;
      }

      particleSystem.rotation.y = elapsedTime * 0.03;

      // Pulse city rings
      cityNodes.forEach((node, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.3;
        node.ringMesh.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '380px',
        cursor: 'grab',
        position: 'relative',
      }}
    />
  );
}
