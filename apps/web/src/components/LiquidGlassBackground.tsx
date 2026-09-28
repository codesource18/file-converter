'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const LiquidGlassBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animationFrameId: number;
    const floatingMeshes: THREE.Object3D[] = [];
    let isVisible = true;

    // Detect mobile / touch environment
    const isMobile = typeof window !== 'undefined' && (
      window.innerWidth < 768 ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        42,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 14);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile, // Disable expensive antialiasing on mobile for maximum battery & performance
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Adaptive pixel ratio cap (1.0 - 1.25 on mobile, up to 1.75 on desktop)
      const maxDpr = isMobile ? 1.2 : 1.75;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isMobile ? 1.05 : 1.15;
      
      // Ensure canvas never intercepts pointer or touch events
      renderer.domElement.style.pointerEvents = 'none';
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.style.userSelect = 'none';
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.inset = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      
      container.appendChild(renderer.domElement);

      // --- 1. LIQUID CAUSTIC SHADER PLANE ---
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      // Simplex noise shader with adaptive distortion factor
      const distortionFactor = isMobile ? '0.22' : '0.85';
      const speedFactor = isMobile ? '0.04' : '0.10';

      const fragmentShader = `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          
          float t = uTime * ${speedFactor};
          float n1 = snoise(uv * 2.0 + vec2(t * 0.3, t * 0.2)) * ${distortionFactor};
          float n2 = snoise(uv * 3.5 - vec2(t * 0.15, -t * 0.3) + vec2(n1 * 0.25)) * ${distortionFactor};
          float n3 = snoise(uv * 1.5 + vec2(-t * 0.1, t * 0.2)) * ${distortionFactor};

          // Deep Liquid Atmosphere Palette
          vec3 baseColor   = vec3(0.02, 0.04, 0.07);    // Deep dark obsidian
          vec3 cyanColor   = vec3(0.08, 0.42, 0.65);    // Soft luminous cyan
          vec3 blueColor   = vec3(0.06, 0.22, 0.52);    // Deep sapphire blue
          vec3 violetColor = vec3(0.24, 0.14, 0.48);    // Subtle mystic violet

          vec3 col = baseColor;
          
          float cyanGlow = smoothstep(-0.2, 0.8, n1) * smoothstep(0.0, 1.2, uv.x + uv.y * 0.4);
          col = mix(col, cyanColor, cyanGlow * 0.32);

          float blueGlow = smoothstep(-0.3, 0.9, n2) * smoothstep(1.2, 0.0, uv.x * 0.8 + uv.y * 0.4);
          col = mix(col, blueColor, blueGlow * 0.26);

          float violetGlow = smoothstep(-0.1, 0.9, n3) * smoothstep(0.9, -0.2, uv.y);
          col = mix(col, violetColor, violetGlow * 0.18);

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const liquidMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        depthWrite: false
      });

      const backgroundPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(35, 22),
        liquidMaterial
      );
      backgroundPlane.position.set(0, 0, -8);
      scene.add(backgroundPlane);

      // --- 2. LIGHTING RIG ---
      const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 1.0 : 1.3);
      scene.add(ambientLight);

      const cyanLight = new THREE.PointLight(0x38bdf8, isMobile ? 2.5 : 4.0, 25);
      cyanLight.position.set(8, 6, 4);
      scene.add(cyanLight);

      const blueLight = new THREE.DirectionalLight(0x3b82f6, isMobile ? 1.8 : 2.8);
      blueLight.position.set(-8, 8, 6);
      scene.add(blueLight);

      // --- 3. GLASS MATERIALS & FLOATING MESHES ---
      const createGlassMaterial = (tintColor: number = 0xffffff, transmission: number = 0.92, opacity: number = 0.6) => {
        return new THREE.MeshPhysicalMaterial({
          color: tintColor,
          transmission: isMobile ? 0.7 : transmission,
          opacity: isMobile ? 0.4 : opacity,
          transparent: true,
          roughness: 0.12,
          ior: 1.4,
          reflectivity: 0.6,
          clearcoat: isMobile ? 0.4 : 0.9,
          clearcoatRoughness: 0.15,
          thickness: 1.0,
          attenuationColor: new THREE.Color(0x38bdf8),
          attenuationDistance: 2.0
        });
      };

      const cyanGlassMat = createGlassMaterial(0x38bdf8, 0.92, 0.55);
      const violetGlassMat = createGlassMaterial(0xa855f7, 0.90, 0.50);

      if (isMobile) {
        // Mobile: Render only 2 subtle decorative shapes (approx. 75% reduction in objects)
        const shape1 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.28, 16, 32), cyanGlassMat);
        shape1.position.set(-3.5, 3.8, -4.5);
        shape1.rotation.set(0.6, 0.3, 0.2);
        shape1.userData = { baseY: 3.8, rotSpeed: { x: 0.0003, y: 0.0005, z: 0.0002 }, speed: 0.4 };
        scene.add(shape1);
        floatingMeshes.push(shape1);

        const shape2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.3), violetGlassMat);
        shape2.position.set(3.8, -3.5, -4.0);
        shape2.rotation.set(0.3, -0.4, 0.2);
        shape2.userData = { baseY: -3.5, rotSpeed: { x: 0.0004, y: 0.0003, z: 0.0003 }, speed: 0.5 };
        scene.add(shape2);
        floatingMeshes.push(shape2);
      } else {
        // Desktop: Richer 3D atmospheric layout
        const slabGeo = new THREE.BoxGeometry(6.5, 4.2, 0.4);
        const slabMesh = new THREE.Mesh(slabGeo, cyanGlassMat);
        slabMesh.position.set(0.5, -0.2, -4.5);
        slabMesh.rotation.set(0.06, -0.10, 0.02);
        slabMesh.userData = { baseY: -0.2, rotSpeed: { x: 0.0003, y: 0.0004, z: 0.0002 }, speed: 0.5 };
        scene.add(slabMesh);
        floatingMeshes.push(slabMesh);

        const torusMesh = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.35, 20, 40), cyanGlassMat);
        torusMesh.position.set(-6.5, 4.2, -4.5);
        torusMesh.rotation.set(0.9, 0.4, 0.3);
        torusMesh.userData = { baseY: 4.2, rotSpeed: { x: 0.0008, y: 0.0012, z: 0.0006 }, speed: 0.65 };
        scene.add(torusMesh);
        floatingMeshes.push(torusMesh);

        const photoTile = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.15), violetGlassMat);
        photoTile.position.set(6.8, -3.8, -3.5);
        photoTile.rotation.set(0.2, -0.2, -0.1);
        photoTile.userData = { baseY: -3.8, rotSpeed: { x: 0.0008, y: 0.0009, z: 0.0005 }, speed: 0.7 };
        scene.add(photoTile);
        floatingMeshes.push(photoTile);

        const octMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), cyanGlassMat);
        octMesh.position.set(4.2, 4.5, -3.8);
        octMesh.userData = { baseY: 4.5, rotSpeed: { x: 0.001, y: 0.0015, z: 0.0008 }, speed: 0.8 };
        scene.add(octMesh);
        floatingMeshes.push(octMesh);
      }

      // --- 4. POINTER / PARALLAX (Desktop only, never captures touch) ---
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        if (isMobile) return;
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 1.5;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 1.5;
      };

      if (!isMobile) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
      }

      // Save GPU/CPU when tab is hidden or minimized
      const handleVisibilityChange = () => {
        isVisible = !document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        liquidMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // --- 5. DELTA-TIME 60/90/120Hz ANIMATION LOOP ---
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Update liquid shader time
        liquidMaterial.uniforms.uTime.value = elapsedTime;

        if (!isMobile) {
          // Smooth desktop parallax
          mouseX += (targetMouseX - mouseX) * 0.03;
          mouseY += (targetMouseY - mouseY) * 0.03;
          camera.position.x = mouseX * 0.4;
          camera.position.y = -mouseY * 0.3;
          camera.lookAt(0, 0, 0);
        }

        // Animate floating glass meshes using delta time
        floatingMeshes.forEach((mesh, index) => {
          const speed = mesh.userData.speed || 0.5;
          const baseY = mesh.userData.baseY || 0;
          const rot = mesh.userData.rotSpeed;

          mesh.position.y = baseY + Math.sin(elapsedTime * 0.6 * speed + index * 1.5) * 0.18;

          if (rot) {
            mesh.rotation.x += rot.x;
            mesh.rotation.y += rot.y;
            mesh.rotation.z += rot.z;
          }
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (!isMobile) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.warn('WebGL initialization fallback:', err);
      setWebglSupported(false);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden"
      style={{
        touchAction: 'none',
        background: !webglSupported
          ? 'radial-gradient(circle at 50% 30%, rgba(56,189,248,0.12) 0%, rgba(0,0,0,1) 80%)'
          : 'transparent'
      }}
    />
  );
};
