import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cinematic 3D "digital Bharat ecosystem" — a slow-rotating glowing orb with
 * connection nodes, arcs, city markers and soft particles.
 *
 * Optimisations:
 *  - DPR clamped (1.5 on mobile, 2 on desktop)
 *  - fewer nodes/particles on small screens
 *  - pauses when off-screen (IntersectionObserver)
 *  - respects prefers-reduced-motion
 *  - fully disposes GPU resources on unmount
 */
const CITIES = [
  { name: 'Delhi', lat: 28.61, lon: 77.21, color: 0x8b7bff },
  { name: 'Mumbai', lat: 19.08, lon: 72.88, color: 0x4f7cff },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59, color: 0x54d6a0 },
  { name: 'Chennai', lat: 13.08, lon: 80.27, color: 0xff9f5c },
  { name: 'Kolkata', lat: 22.57, lon: 88.36, color: 0xd48bff },
  { name: 'Hyderabad', lat: 17.39, lon: 78.49, color: 0x7ee0ff },
  { name: 'Jaipur', lat: 26.91, lon: 75.79, color: 0xffc97a },
];

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function makeGlowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export default function HeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 640;

    // ---- Scene / camera / renderer -------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 4.6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000, 0);
    container.appendChild(renderer.domElement);

    // ---- Lights --------------------------------------------------------------------
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0x8b7bff, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4f7cff, 1.2);
    rim.position.set(-4, -2, -3);
    scene.add(rim);
    const warm = new THREE.DirectionalLight(0xff9f5c, 0.45);
    warm.position.set(2, -3, 4);
    scene.add(warm);

    // ---- Central orb ----------------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const coreGeo = new THREE.SphereGeometry(1.5, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10122a,
      emissive: 0x1a1e45,
      emissiveIntensity: 0.6,
      metalness: 0.55,
      roughness: 0.35,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // inner tinted shell (subtle gradient feel)
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x5b5ff5,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.62, 32, 32), shellMat);
    group.add(shell);

    // wireframe latitude lines
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6d6aff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.72, 2), wireMat);
    group.add(wire);

    // ---- City glow markers -----------------------------------------------------------
    const glowTex = makeGlowTexture();
    const markerRadius = isMobile ? 1.56 : 1.56;
    const markers = [];
    CITIES.forEach((c) => {
      const pos = latLonToVector3(c.lat, c.lon, markerRadius);
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: c.color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.setScalar(isMobile ? 0.34 : 0.38);
      sprite.position.copy(pos);
      markers.push({ sprite, base: pos.clone() });
      group.add(sprite);
    });

    // small pin dots on mate surface
    const pinGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const pinMats = CITIES.map((c) => new THREE.MeshBasicMaterial({ color: c.color }));
    CITIES.forEach((c, i) => {
      const pos = latLonToVector3(c.lat, c.lon, 1.55);
      const pin = new THREE.Mesh(pinGeo, pinMats[i]);
      pin.position.copy(pos);
      group.add(pin);
    });

    // ---- Connection arcs --------------------------------------------------------------
    const arcMat = new THREE.LineBasicMaterial({ color: 0x7c6cf6, transparent: true, opacity: 0.4 });
    for (let i = 0; i < CITIES.length - 1; i++) {
      const a = latLonToVector3(CITIES[i].lat, CITIES[i].lon, 1.56);
      const b = latLonToVector3(CITIES[i + 1].lat, CITIES[i + 1].lon, 1.56);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(2.1);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      group.add(new THREE.Line(geo, arcMat));
    }
    // one ring arc back to start
    const a0 = latLonToVector3(CITIES[6].lat, CITIES[6].lon, 1.56);
    const b0 = latLonToVector3(CITIES[0].lat, CITIES[0].lon, 1.56);
    const m0 = a0.clone().add(b0).multiplyScalar(0.5).normalize().multiplyScalar(2.1);
    const c0 = new THREE.QuadraticBezierCurve3(a0, m0, b0);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c0.getPoints(24)), arcMat));

    // ---- Tilted rotating rings -----------------------------------------------------------
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6d6aff, transparent: true, opacity: 0.16 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.006, 8, 120), ringMat);
    ring1.rotation.x = Math.PI / 2.4;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.004, 8, 120), ringMat);
    ring2.rotation.x = Math.PI / 1.9;
    ring2.rotation.y = 0.6;
    group.add(ring1, ring2);

    // ---- Ambient particle field ------------------------------------------------------------
    const particleCount = isMobile ? 150 : 320;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [new THREE.Color(0x8b7bff), new THREE.Color(0x4f7cff), new THREE.Color(0x9a95ff), new THREE.Color(0xff9f5c)];
    for (let i = 0; i < particleCount; i++) {
      const r = 2.6 + Math.random() * 4.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.03 : 0.04,
      map: glowTex,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---- Interaction (parallax) ---------------------------------------------------------------
    let targetX = 0;
    let targetY = 0;
    const onMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!reducedMotion && !isMobile) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    // ---- Resize --------------------------------------------------------------------------
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ---- Pause when off-screen -----------------------------------------------------------
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(container);

    // ---- Animation loop ------------------------------------------------------------------
    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();

      if (!reducedMotion) {
        group.rotation.y += 0.0022; // slow ambient rotation
        ring1.rotation.z += 0.0016;
        ring2.rotation.z -= 0.0012;
        particles.rotation.y = t * 0.02;
        markers.forEach((m, i) => {
          const s = 1 + Math.sin(t * 2.4 + i) * 0.18;
          m.sprite.scale.setScalar((isMobile ? 0.34 : 0.38) * s);
        });
      }

      // smooth mouse parallax
      const rotY = targetX * 0.3;
      const rotX = targetY * 0.18;
      group.rotation.x += (rotX - group.rotation.x) * 0.04;
      group.rotation.y += (rotY - group.rotation.y) * 0.04;
      particles.rotation.x = group.rotation.x * 0.25;
      particles.rotation.z = targetX * 0.12;

      renderer.render(scene, camera);
    };
    animate();

    // ---- Cleanup ---------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      glowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="bb-hero-scene" aria-hidden="true" />;
}
