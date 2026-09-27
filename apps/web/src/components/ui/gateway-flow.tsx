"use client";

import React, { useEffect, useRef } from "react";

export type GatewayFlowProps = {
  speed?: number;
  density?: number;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

interface Particle {
  t: number;
  speed: number;
  size: number;
  alpha: number;
}

interface PathDef {
  isLeft: boolean;
  startY: number;
  particles: Particle[];
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  life: number;
}

export default function GatewayFlow({
  speed = 1.0,
  density = 1.0,
  opacity = 1.0,
  strokeWidth = 1.0,
  className = "",
  style = {},
}: GatewayFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let explosions: Explosion[] = [];
    let frameCount = 0;
    let mouse = { x: width / 2, y: height / 2, active: false };

    const numPaths = Math.max(24, Math.round(110 * density));
    const paths: PathDef[] = [];

    function initPaths() {
      paths.length = 0;
      for (let i = 0; i < numPaths; i++) {
        paths.push({
          isLeft: i % 2 === 0,
          startY: (i / numPaths) * height * 1.5 - height * 0.25,
          particles: [
            {
              t: Math.random(),
              speed: (0.0016 + Math.random() * 0.0022) * speed,
              size: 2.4 + Math.random() * 1.6,
              alpha: 0.6 + Math.random() * 0.4,
            },
            {
              t: Math.random(),
              speed: (0.0010 + Math.random() * 0.0016) * speed,
              size: 1.6 + Math.random() * 1.2,
              alpha: 0.45 + Math.random() * 0.35,
            },
          ],
        });
      }
    }

    function handleResize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
      initPaths();
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      explosions.push({ x: clientX, y: clientY, radius: 0, life: 1 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);
    handleResize();

    function getBezierPoint(
      t: number,
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) {
      const u = 1 - t;
      return {
        x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
      };
    }

    function render() {
      frameCount++;
      ctx!.clearRect(0, 0, width, height);

      // Center Singularity in Viewport
      const centerX = width / 2;
      const centerY = height / 2;

      // Ambient rhythmic energy bursts
      if (frameCount % 180 === 0 && explosions.length < 3) {
        explosions.push({
          x: centerX + (Math.random() - 0.5) * 100,
          y: centerY + (Math.random() - 0.5) * 60,
          radius: 0,
          life: 0.85,
        });
      }

      // Update interactive shockwaves
      for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.radius += 13;
        exp.life -= 0.015;
        if (exp.life <= 0) {
          explosions.splice(i, 1);
        } else {
          ctx!.beginPath();
          ctx!.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, exp.life * 0.3 * opacity)})`;
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }
      }

      // Draw flowing bezier paths & shimmering particles
      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? -30 : width + 30, y: path.startY };
        const p1 = {
          x: path.isLeft ? centerX * 0.45 : width - centerX * 0.45,
          y: path.startY,
        };
        const p2 = {
          x: path.isLeft ? centerX * 0.82 : width - centerX * 0.82,
          y: centerY + Math.sin(frameCount * 0.018 + path.startY * 0.008) * 22,
        };
        const p3 = { x: centerX, y: centerY };

        // Dotted bezier guide stream
        ctx!.beginPath();
        ctx!.moveTo(p0.x, p0.y);
        ctx!.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx!.strokeStyle = `rgba(186, 230, 253, ${0.18 * opacity})`;
        ctx!.lineWidth = 1.0 * strokeWidth;
        ctx!.setLineDash([2, 6]);
        ctx!.stroke();
        ctx!.setLineDash([]);

        // Animate particles along the curve
        path.particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 18;
          }

          let pos = getBezierPoint(p.t, p0, p1, p2, p3);

          // Deflect around explosions
          let dxTotal = 0;
          let dyTotal = 0;
          explosions.forEach((exp) => {
            const dx = pos.x - exp.x;
            const dy = pos.y - exp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 150 && dist > exp.radius - 150 && dist > 1) {
              const force = (1 - Math.abs(dist - exp.radius) / 150) * exp.life;
              dxTotal += (dx / dist) * force * 75;
              dyTotal += (dy / dist) * force * 75;
            }
          });

          pos.x += dxTotal;
          pos.y += dyTotal;

          // Glowing white-cyan particle core
          const particleAlpha = Math.min(1, p.alpha * opacity * (1 - p.t * 0.2));
          ctx!.fillStyle = `rgba(255, 255, 255, ${particleAlpha})`;
          ctx!.beginPath();
          ctx!.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
          ctx!.fill();

          // Soft luminous cyan halo
          ctx!.fillStyle = `rgba(56, 189, 248, ${particleAlpha * 0.55})`;
          ctx!.beginPath();
          ctx!.arc(pos.x, pos.y, p.size * 2.4, 0, Math.PI * 2);
          ctx!.fill();
        });
      });

      // Luminous center pulse halo
      const pulseSize = 40 + Math.sin(frameCount * 0.035) * 10;
      const coreGradient = ctx!.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        pulseSize * 2.8
      );
      coreGradient.addColorStop(0, `rgba(56, 189, 248, ${0.32 * opacity})`);
      coreGradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.15 * opacity})`);
      coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx!.fillStyle = coreGradient;
      ctx!.beginPath();
      ctx!.arc(centerX, centerY, pulseSize * 2.8, 0, Math.PI * 2);
      ctx!.fill();

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [speed, density, opacity, strokeWidth]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-black ${className}`}
      style={style}
    >
      {/* Dynamic Centered Radial Background Halo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.18) 0%, rgba(37, 99, 235, 0.10) 35%, rgba(15, 23, 42, 0.05) 65%, rgba(0, 0, 0, 0) 90%)",
        }}
      />
      
      {/* Centered Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
