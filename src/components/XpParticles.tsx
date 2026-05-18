import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleSpark {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  amount?: number;
  type: 'main' | 'spark' | 'rain';
}

export const XpParticles = () => {
  const [sparks, setSparks] = useState<ParticleSpark[]>([]);
  const [isXpRainActive, setIsXpRainActive] = useState(false);
  const rainTimerRef = useRef<any>(null);

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
    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpAdded, statNames } = customEvent.detail;
      const primaryStat = statNames && statNames[0] ? statNames[0] : '';
      const color = getStatColor(primaryStat);

      // Mouse position or random center as fallback
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;

      // Spawn main text particle
      const mainId = Math.random().toString(36).substring(7);
      const newMain: ParticleSpark = {
        id: mainId,
        x,
        y,
        vx: 0,
        vy: -3,
        color,
        size: 14,
        amount: xpAdded,
        type: 'main'
      };

      // Spawn secondary trail burst sparks (5-8 sparks)
      const burstSparks: ParticleSpark[] = Array.from({ length: 7 }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2.5;
        return {
          id: Math.random().toString(36).substring(7),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5, // bias upward
          color,
          size: 4 + Math.random() * 4,
          type: 'spark'
        };
      });

      setSparks((prev) => [...prev, newMain, ...burstSparks]);
    };

    const handleLevelUpEvent = () => {
      // Trigger XP rain for 3 seconds
      setIsXpRainActive(true);
      if (rainTimerRef.current) clearTimeout(rainTimerRef.current);
      rainTimerRef.current = setTimeout(() => {
        setIsXpRainActive(false);
      }, 3000);
    };

    window.addEventListener('monarch-xp-granted', handleXpEvent);
    window.addEventListener('monarch-level-up-notif', handleLevelUpEvent);

    return () => {
      window.removeEventListener('monarch-xp-granted', handleXpEvent);
      window.removeEventListener('monarch-level-up-notif', handleLevelUpEvent);
      if (rainTimerRef.current) clearTimeout(rainTimerRef.current);
    };
  }, []);

  // Generate rain particles periodically when active
  useEffect(() => {
    if (!isXpRainActive) return;

    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const newRain: ParticleSpark = {
        id: Math.random().toString(36).substring(7),
        x,
        y: -10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 4 + Math.random() * 4,
        color: '#F59E0B', // Golden XP rain aura
        size: 3 + Math.random() * 3,
        type: 'rain'
      };
      setSparks((prev) => [...prev, newRain]);
    }, 45);

    return () => clearInterval(interval);
  }, [isXpRainActive]);

  // Handle particle completion callback to clean state
  const handleRemove = (id: string) => {
    setSparks((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {sparks.map((spark) => (
          <Particle key={spark.id} spark={spark} onComplete={() => handleRemove(spark.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Particle = ({ spark, onComplete }: { spark: ParticleSpark; onComplete: () => void }) => {
  useEffect(() => {
    const duration = spark.type === 'main' ? 1400 : spark.type === 'rain' ? 2200 : 900;
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, spark.type]);

  if (spark.type === 'main') {
    return (
      <motion.div
        initial={{ opacity: 1, x: spark.x, y: spark.y, scale: 0.7 }}
        animate={{ opacity: 0, y: spark.y - 120, scale: 1.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute font-space-mono font-black text-sm tracking-wider uppercase drop-shadow-[0_0_10px_var(--shadow-color)]"
        style={{
          color: spark.color,
          // @ts-ignore
          '--shadow-color': spark.color,
          textShadow: `0 0 8px ${spark.color}`
        }}
      >
        +{spark.amount} XP
      </motion.div>
    );
  }

  if (spark.type === 'rain') {
    return (
      <motion.div
        initial={{ opacity: 0.9, x: spark.x, y: spark.y }}
        animate={{ opacity: 0, x: spark.x + spark.vx * 15, y: window.innerHeight + 10 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2.2, ease: 'linear' }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: spark.size,
          height: spark.size * 3, // slightly stretched falling effect
          backgroundColor: spark.color,
          boxShadow: `0 0 10px ${spark.color}, 0 0 20px ${spark.color}`
        }}
      />
    );
  }

  // Mini sparks trails
  return (
    <motion.div
      initial={{ opacity: 1, x: spark.x, y: spark.y, scale: 1 }}
      animate={{
        opacity: 0,
        x: spark.x + spark.vx * 30,
        y: spark.y + spark.vy * 30,
        scale: 0.1
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: spark.size,
        height: spark.size,
        backgroundColor: spark.color,
        boxShadow: `0 0 6px ${spark.color}`
      }}
    />
  );
};
