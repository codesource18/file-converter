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
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

      // --- 1. LIQUID CAUSTIC SHADER PLANE (Deep flowing blue, cyan, violet) ---
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        varying vec2 vUv;

        // Simplex / Perlin noise helper
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
          
          // Slow multi-layered liquid displacement
          float t = uTime * 0.12;
          float n1 = snoise(uv * 2.2 + vec2(t * 0.4, t * 0.3));
          float n2 = snoise(uv * 4.0 - vec2(t * 0.2, -t * 0.5) + vec2(n1 * 0.35));
          float n3 = snoise(uv * 1.5 + vec2(-t * 0.15, t * 0.25) + vec2(n2 * 0.25));

          // Base palette: Ice Base (#EDF7FF), Sapphire (#2F80FF), Cyan (#39D5FF), Soft Violet (#8B6CFF)
          vec3 baseColor   = vec3(0.929, 0.968, 1.0);     // #EDF7FF
          vec3 cyanColor   = vec3(0.223, 0.835, 1.0);     // #39D5FF
          vec3 blueColor   = vec3(0.184, 0.502, 1.0);     // #2F80FF
          vec3 violetColor = vec3(0.545, 0.423, 1.0);     // #8B6CFF

          // Mix colors based on flowing noise layers
          vec3 col = baseColor;
          
          // Add cyan wave in upper-right
          float cyanGlow = smoothstep(-0.2, 0.7, n1) * smoothstep(0.0, 1.1, uv.x + uv.y * 0.5);
          col = mix(col, cyanColor, cyanGlow * 0.35);

          // Add blue depth stream in center-left
          float blueGlow = smoothstep(-0.4, 0.8, n2) * smoothstep(1.1, 0.0, uv.x * 0.8 + uv.y * 0.4);
          col = mix(col, blueColor, blueGlow * 0.28);

          // Add soft violet caustic ribbon in lower region
          float violetGlow = smoothstep(-0.1, 0.9, n3) * smoothstep(0.8, -0.2, uv.y);
          col = mix(col, violetColor, violetGlow * 0.22);

          // Caustic light sparkles
          float caustic = pow(max(0.0, n1 * n2 + n3 * 0.5), 3.0);
          col += vec3(0.9, 0.97, 1.0) * (caustic * 0.25);

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const liquidMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uMouse: { value: new THREE.Vector2(0, 0) }
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
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      // Cyan light top-right
      const cyanLight = new THREE.PointLight(0x39d5ff, 4.5, 25);
      cyanLight.position.set(8, 6, 4);
      scene.add(cyanLight);

      // Blue light top-left
      const blueLight = new THREE.DirectionalLight(0x2f80ff, 3.2);
      blueLight.position.set(-8, 8, 6);
      scene.add(blueLight);

      // Violet light bottom-center
      const violetLight = new THREE.PointLight(0x8b6cff, 3.8, 22);
      violetLight.position.set(0, -6, 3);
      scene.add(violetLight);

      // Soft white front fill
      const frontLight = new THREE.DirectionalLight(0xffffff, 1.8);
      frontLight.position.set(0, 2, 10);
      scene.add(frontLight);

      // --- 3. PREMIUM PHYSICAL GLASS MATERIALS ---
      const createGlassMaterial = (tintColor: number = 0xffffff, transmission: number = 0.94, opacity: number = 0.65) => {
        return new THREE.MeshPhysicalMaterial({
          color: tintColor,
          transmission: transmission,
          opacity: opacity,
          transparent: true,
          roughness: 0.08,
          ior: 1.45,
          reflectivity: 0.8,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          thickness: 1.2,
          attenuationColor: new THREE.Color(0xdbeafe),
          attenuationDistance: 1.5
        });
      };

      const pureGlassMat = createGlassMaterial(0xffffff, 0.95, 0.7);
      const cyanGlassMat = createGlassMaterial(0xe0f7ff, 0.92, 0.75);
      const blueGlassMat = createGlassMaterial(0xdbeafe, 0.90, 0.8);
      const violetGlassMat = createGlassMaterial(0xede9fe, 0.90, 0.75);

      // --- 4. FLOATING 3D GLASS OBJECTS ---

      // A. Large Translucent Glass Slab (Directly behind workspace)
      const slabGeo = new THREE.BoxGeometry(7.0, 4.8, 0.5);
      const slabMesh = new THREE.Mesh(slabGeo, cyanGlassMat);
      slabMesh.position.set(0.5, -0.2, -4.5);
      slabMesh.rotation.set(0.08, -0.12, 0.02);
      slabMesh.userData = {
        baseY: -0.2,
        rotSpeed: { x: 0.0004, y: 0.0006, z: 0.0003 },
        speed: 0.6
      };
      scene.add(slabMesh);
      floatingMeshes.push(slabMesh);

      // B. Glass PDF Document Sheet (Upper right hero)
      const pdfGroup = new THREE.Group();
      const pdfSheetGeo = new THREE.BoxGeometry(2.4, 3.2, 0.12);
      const pdfSheetMesh = new THREE.Mesh(pdfSheetGeo, pureGlassMat);
      pdfGroup.add(pdfSheetMesh);

      // Add embossed accent lines on the PDF sheet
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
      for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(1.6 - i * 0.2, 0.06, 0.02), lineMat);
        line.position.set(-0.2 + i * 0.05, 0.8 - i * 0.45, 0.07);
        pdfGroup.add(line);
      }

      pdfGroup.position.set(7.5, 3.2, -3.2);
      pdfGroup.rotation.set(-0.15, -0.35, 0.1);
      pdfGroup.userData = {
        baseY: 3.2,
        rotSpeed: { x: 0.001, y: 0.0015, z: 0.0008 },
        speed: 0.9
      };
      scene.add(pdfGroup);
      floatingMeshes.push(pdfGroup);

      // C. Glass Image Photo Tile (Lower right)
      const imageTileGeo = new THREE.BoxGeometry(2.6, 2.0, 0.16);
      const imageTileMesh = new THREE.Mesh(imageTileGeo, violetGlassMat);
      imageTileMesh.position.set(6.8, -4.2, -3.5);
      imageTileMesh.rotation.set(0.2, -0.25, -0.15);
      imageTileMesh.userData = {
        baseY: -4.2,
        rotSpeed: { x: 0.0012, y: 0.001, z: 0.0009 },
        speed: 0.8
      };
      scene.add(imageTileMesh);
      floatingMeshes.push(imageTileMesh);

      // D. Large Beveled Glass Cube (Far left behind sidebar)
      const leftCubeGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const leftCubeMesh = new THREE.Mesh(leftCubeGeo, blueGlassMat);
      leftCubeMesh.position.set(-8.5, 1.2, -4.0);
      leftCubeMesh.rotation.set(0.4, 0.5, 0.2);
      leftCubeMesh.userData = {
        baseY: 1.2,
        rotSpeed: { x: 0.0015, y: 0.002, z: 0.001 },
        speed: 0.7
      };
      scene.add(leftCubeMesh);
      floatingMeshes.push(leftCubeMesh);

      // E. Glass Torus Ring (Upper left)
      const torusGeo = new THREE.TorusGeometry(1.4, 0.38, 24, 48);
      const torusMesh = new THREE.Mesh(torusGeo, cyanGlassMat);
      torusMesh.position.set(-6.5, 4.8, -4.8);
      torusMesh.rotation.set(1.0, 0.4, 0.3);
      torusMesh.userData = {
        baseY: 4.8,
        rotSpeed: { x: 0.001, y: 0.0018, z: 0.0012 },
        speed: 0.75
      };
      scene.add(torusMesh);
      floatingMeshes.push(torusMesh);

      // F. Small Orbiting Glass Prisms & Cubes
      const smallCubeConfigs = [
        { geo: new THREE.BoxGeometry(1.2, 1.2, 1.2), mat: pureGlassMat, pos: [-4.2, -3.8, -3.0], speed: 1.1 },
        { geo: new THREE.OctahedronGeometry(0.9), mat: cyanGlassMat, pos: [3.8, 5.0, -4.0], speed: 1.2 },
        { geo: new THREE.BoxGeometry(1.0, 1.0, 1.0), mat: violetGlassMat, pos: [-2.8, 4.2, -3.5], speed: 0.95 },
        { geo: new THREE.TorusGeometry(0.8, 0.22, 16, 32), mat: blueGlassMat, pos: [8.8, -1.0, -4.5], speed: 1.05 }
      ];

      smallCubeConfigs.forEach((cfg) => {
        const mesh = new THREE.Mesh(cfg.geo, cfg.mat);
        mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
          baseY: cfg.pos[1],
          rotSpeed: { x: 0.002, y: 0.0025, z: 0.0015 },
          speed: cfg.speed
        };
        scene.add(mesh);
        floatingMeshes.push(mesh);
      });

      // --- 5. MOUSE PARALLAX CONTROLLER ---
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2.0;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2.0;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      // Handle visibility changes to save CPU/GPU cycles when user switches tabs
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

      // --- 6. 60 FPS RENDER LOOP ---
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (!isVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Update liquid shader time
        liquidMaterial.uniforms.uTime.value = elapsedTime;
        liquidMaterial.uniforms.uMouse.value.set(mouseX, mouseY);

        // Smooth parallax interpolation
        mouseX += (targetMouseX - mouseX) * 0.04;
        mouseY += (targetMouseY - mouseY) * 0.04;

        // Camera subtle sway
        camera.position.x = mouseX * 0.6;
        camera.position.y = -mouseY * 0.5;
        camera.lookAt(0, 0, 0);

        // Animate floating glass meshes
        floatingMeshes.forEach((mesh, index) => {
          const speed = mesh.userData.speed || 1.0;
          const baseY = mesh.userData.baseY || 0;
          const rot = mesh.userData.rotSpeed;

          // Gentle floating sine wave
          mesh.position.y = baseY + Math.sin(elapsedTime * 0.8 * speed + index * 1.2) * 0.25;

          // Very slow rotation
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
        window.removeEventListener('mousemove', handleMouseMove);
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
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{
        background: !webglSupported
          ? 'radial-gradient(circle at 80% 20%, #39d5ff30 0%, #edf7ff 50%, #8b6cff20 100%)'
          : 'transparent'
      }}
    />
  );
};
