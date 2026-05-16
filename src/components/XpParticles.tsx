import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';

export const XpParticles = () => {
  const { particles, removeParticle } = useUIStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <Particle key={particle.id} particle={particle} onComplete={() => removeParticle(particle.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Particle = ({ particle, onComplete }: { particle: any, onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, x: particle.x, y: particle.y, scale: 0.5 }}
      animate={{ opacity: 0, y: particle.y - 150, scale: 1.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute font-space-mono font-bold text-accent-blue drop-shadow-md shadow-neon-blue"
      style={{ textShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }}
    >
      +{particle.amount} XP
    </motion.div>
  );
};
