import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AiAssistant3DCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 100;
    const height = container.clientHeight || 100;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 110;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Main Robot Avatar Group
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // 1. Robot Head (Smooth Rounded Sphere/Box)
    const headGeo = new THREE.SphereGeometry(22, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5, // Deep Indigo
      emissive: 0x312e81,
      specular: 0x818cf8,
      shininess: 90,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    robotGroup.add(headMesh);

    // 2. Glossy Face Visor
    const visorGeo = new THREE.CylinderGeometry(15, 15, 12, 32, 1, false, -Math.PI / 3, Math.PI / 1.5);
    const visorMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a, // Dark Obsidian Glass
      specular: 0x38bdf8,
      shininess: 120,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 1, 10);
    visorMesh.rotation.x = Math.PI / 12;
    robotGroup.add(visorMesh);

    // 3. Glowing Digital Eyes
    const eyeGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Cyan Glow

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-6.5, 3, 20);
    robotGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(6.5, 3, 20);
    robotGroup.add(rightEye);

    // 4. Happy Smile Arc
    const smileGeo = new THREE.TorusGeometry(5, 0.9, 12, 24, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Warm Amber Glow
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    smileMesh.position.set(0, -3.5, 20.5);
    smileMesh.rotation.z = Math.PI; // Inverted arc = Happy Smile :)
    robotGroup.add(smileMesh);

    // 5. Antenna Pole & Pulsing Tip Light
    const antPoleGeo = new THREE.CylinderGeometry(0.8, 1.2, 10, 16);
    const antPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const antPole = new THREE.Mesh(antPoleGeo, antPoleMat);
    antPole.position.set(0, 26, 0);
    robotGroup.add(antPole);

    const antTipGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const antTipMat = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Saffron Tip
    const antTip = new THREE.Mesh(antTipGeo, antTipMat);
    antTip.position.set(0, 32, 0);
    robotGroup.add(antTip);

    // 6. Side Headphones / Ear Caps
    const earGeo = new THREE.CylinderGeometry(4.5, 4.5, 3, 16);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.5 });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-22.5, 1, 0);
    leftEar.rotation.z = Math.PI / 2;
    robotGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(22.5, 1, 0);
    rightEar.rotation.z = Math.PI / 2;
    robotGroup.add(rightEar);

    // 7. Outer Holographic Orbit Ring
    const haloGeo = new THREE.TorusGeometry(34, 0.8, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    const haloRing = new THREE.Mesh(haloGeo, haloMat);
    haloRing.rotation.x = Math.PI / 3;
    robotGroup.add(haloRing);

    // Lights
    const frontLight = new THREE.PointLight(0x60a5fa, 2.5, 250);
    frontLight.position.set(30, 40, 60);
    scene.add(frontLight);

    const backLight = new THREE.PointLight(0xf43f5e, 2, 200);
    backLight.position.set(-40, -30, -50);
    scene.add(backLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Cute head floating hover & friendly rotation
      robotGroup.position.y = Math.sin(t * 2.2) * 3;
      robotGroup.rotation.y = Math.sin(t * 1.2) * 0.3;
      robotGroup.rotation.x = Math.cos(t * 1.5) * 0.08;

      // Rotate holographic halo
      haloRing.rotation.z = t * 0.8;
      haloRing.rotation.y = t * 0.5;

      // Pulse antenna light
      const scalePulse = 1 + Math.sin(t * 5) * 0.18;
      antTip.scale.set(scalePulse, scalePulse, scalePulse);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    />
  );
}
