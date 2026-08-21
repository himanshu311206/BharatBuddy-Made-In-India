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
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 120;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Core Glowing Sphere
    const coreGeo = new THREE.IcosahedronGeometry(25, 3);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      specular: 0xec4899,
      shininess: 100,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Orbiting Ring 1
    const ring1Geo = new THREE.TorusGeometry(38, 1.2, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xf97316, wireframe: true });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    scene.add(ring1);

    // Orbiting Ring 2
    const ring2Geo = new THREE.TorusGeometry(46, 0.8, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    // Lights
    const light1 = new THREE.PointLight(0xff4500, 2, 200);
    light1.position.set(50, 50, 50);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x00f0ff, 2, 200);
    light2.position.set(-50, -50, -50);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Particles around AI core
    const pGeo = new THREE.BufferGeometry();
    const pCount = 60;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 110;
      pPos[i + 1] = (Math.random() - 0.5) * 110;
      pPos[i + 2] = (Math.random() - 0.5) * 110;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xa855f7, size: 2.5, transparent: true, opacity: 0.8 });
    const pSystem = new THREE.Points(pGeo, pMat);
    scene.add(pSystem);

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      coreMesh.rotation.y = t * 0.8;
      coreMesh.rotation.x = t * 0.4;

      ring1.rotation.x = t * 1.2;
      ring1.rotation.y = t * 0.6;

      ring2.rotation.y = -t * 1.5;
      ring2.rotation.z = t * 0.8;

      pSystem.rotation.y = t * 0.2;

      // Pulse core scale
      const s = 1 + Math.sin(t * 3) * 0.08;
      coreMesh.scale.set(s, s, s);

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
