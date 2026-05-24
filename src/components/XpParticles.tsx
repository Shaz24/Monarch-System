import { useEffect, useRef } from 'react';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  type: 'main' | 'spark' | 'rain';
  amount?: number;
}

export const XpParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isXpRainActiveRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Map stat names to cyberpunk theme colors
  const getStatColor = (stat: string) => {
    const s = stat.toLowerCase();
    if (s.includes('intel') || s.includes('cod') || s.includes('eng')) return '#06B6D4'; // Cyan
    if (s.includes('mind') || s.includes('focus') || s.includes('mental') || s.includes('disc')) return '#7C3AED'; // Purple
    if (s.includes('fit') || s.includes('strength') || s.includes('phys') || s.includes('end')) return '#EF4444'; // Red
    if (s.includes('creat') || s.includes('broad') || s.includes('social') || s.includes('charm')) return '#F59E0B'; // Gold
    return '#3B82F6'; // Blue fallback
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main requestAnimationFrame drawing loop
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'main') {
          // Floating numeric indicators (+XP)
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.font = '900 13px "Space Mono", monospace';
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fillText(`+${p.amount} XP`, p.x, p.y);
          ctx.restore();
        } else if (p.type === 'rain') {
          // Level-up celebration vertical rain
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.y > canvas.height + 10 || p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size * 3.5);
          ctx.restore();
        } else {
          // Mini dynamic spark bursts
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Rain generators
      if (isXpRainActiveRef.current && Math.random() < 0.4) {
        particles.push({
          id: Math.random().toString(36).substring(7),
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 4 + Math.random() * 4,
          color: '#F59E0B',
          size: 1.5 + Math.random() * 2,
          alpha: 1,
          decay: 0.004 + Math.random() * 0.008,
          type: 'rain'
        });
      }

      // Automatically sleep loop when animation items finish
      if (particles.length > 0 || isXpRainActiveRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(render);
      } else {
        animationFrameIdRef.current = null;
      }
    };

    const startLoopIfNeeded = () => {
      if (animationFrameIdRef.current === null) {
        animationFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpAdded, statNames } = customEvent.detail;
      const primaryStat = statNames && statNames[0] ? statNames[0] : '';
      const color = getStatColor(primaryStat);

      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;

      particlesRef.current.push({
        id: Math.random().toString(36).substring(7),
        x,
        y,
        vx: 0,
        vy: -2,
        color,
        size: 13,
        alpha: 1,
        decay: 0.012,
        type: 'main',
        amount: xpAdded
      });

      // Spawn 18 high-fidelity sparks
      const numSparks = 18;
      for (let i = 0; i < numSparks; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        particlesRef.current.push({
          id: Math.random().toString(36).substring(7),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color,
          size: 1.5 + Math.random() * 2.5,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02,
          type: 'spark'
        });
      }

      startLoopIfNeeded();
    };

    let rainTimeout: any = null;
    const handleLevelUpEvent = () => {
      isXpRainActiveRef.current = true;
      startLoopIfNeeded();

      if (rainTimeout) clearTimeout(rainTimeout);
      rainTimeout = setTimeout(() => {
        isXpRainActiveRef.current = false;
      }, 3000);
    };

    window.addEventListener('monarch-xp-granted', handleXpEvent);
    window.addEventListener('monarch-level-up-notif', handleLevelUpEvent);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('monarch-xp-granted', handleXpEvent);
      window.removeEventListener('monarch-level-up-notif', handleLevelUpEvent);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rainTimeout) clearTimeout(rainTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
