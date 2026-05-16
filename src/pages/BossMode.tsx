import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Swords, ShieldAlert, CheckSquare, Square, Zap } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';

interface BossQuest {
  id: string;
  title: string;
  completed: boolean;
  damage: number;
}

const INITIAL_QUESTS: BossQuest[] = [
  { id: 'q1', title: 'Architect the Database Schema', completed: false, damage: 1000 },
  { id: 'q2', title: 'Implement JWT Authentication', completed: false, damage: 1500 },
  { id: 'q3', title: 'Design the Core Dashboard HUD', completed: false, damage: 1200 },
  { id: 'q4', title: 'Integrate Payment Gateway', completed: false, damage: 2500 },
  { id: 'q5', title: 'Deploy to Production Server', completed: false, damage: 3800 },
];

export default function BossMode() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const [quests, setQuests] = useState<BossQuest[]>(INITIAL_QUESTS);
  
  const MAX_HP = 10000;
  const currentDamage = quests.filter(q => q.completed).reduce((acc, q) => acc + q.damage, 0);
  const currentHP = Math.max(0, MAX_HP - currentDamage);
  const hpPercent = (currentHP / MAX_HP) * 100;
  
  const isDefeated = currentHP === 0;

  const handleStrike = (e: React.MouseEvent, id: string) => {
    if (isDefeated) return;
    
    setQuests(quests.map(q => {
      if (q.id === id && !q.completed) {
        // Attack visuals
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        addXpParticle(rect.left, rect.top, q.damage); // Visualizing damage as red particles would be cool, using XP for now
        
        toast('Critical Hit! Boss HP dropping.', { icon: '⚔️' });
        
        // If this strike kills the boss
        if (currentDamage + q.damage >= MAX_HP) {
          setTimeout(() => {
            toast.success('BOSS DEFEATED. MASSIVE XP GAIN.', { duration: 5000, icon: '🏆' });
            triggerLevelUp();
          }, 1000);
        }
        
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-12"
    >
      <div className="text-center space-y-4 relative">
        <h1 className="font-orbitron text-5xl md:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#ff003c] to-[#8b0000]" style={{ textShadow: '0 0 40px rgba(255, 0, 60, 0.4)' }}>
          BOSS FIGHT
        </h1>
        <p className="font-space-mono text-sm text-[#ff003c]/70 tracking-[0.3em] uppercase">
          Class-S Threat Detected: Project Launch
        </p>
      </div>

      {/* Boss Visual & HP Bar */}
      <div className="max-w-3xl mx-auto text-center relative mt-12">
        <motion.div
          animate={isDefeated ? { opacity: 0, scale: 0.5, filter: 'blur(10px)' } : { y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative inline-block mb-12"
        >
          <div className="absolute inset-0 bg-[#ff003c] blur-[100px] opacity-20 rounded-full" />
          <Skull className={`w-48 h-48 mx-auto relative z-10 transition-colors duration-1000 ${isDefeated ? 'text-white/10' : 'text-[#ff003c]'}`} style={{ filter: isDefeated ? 'none' : 'drop-shadow(0 0 20px rgba(255, 0, 60, 0.8))' }} />
        </motion.div>

        {/* HP Bar */}
        <div className="glass-panel p-4 border border-[#ff003c]/30 relative overflow-hidden bg-void">
          <div className="flex justify-between font-orbitron font-bold text-xl mb-2 px-2">
            <span className="text-white uppercase tracking-widest">HP</span>
            <span className={isDefeated ? 'text-white/30' : 'text-[#ff003c] text-shadow-neon-red'}>
              {currentHP} / {MAX_HP}
            </span>
          </div>
          <div className="w-full h-8 bg-black border-2 border-white/10 relative overflow-hidden">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="h-full bg-gradient-to-r from-[#8b0000] to-[#ff003c] relative shadow-[0_0_20px_rgba(255,0,60,0.8)]"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-50 mix-blend-overlay" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quest List / Attacks */}
      <div className="max-w-3xl mx-auto">
        <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 border-l-4 border-[#ff003c] pl-3 text-white">
          <Swords className="w-5 h-5 text-[#ff003c]" />
          Tactical Strike Objectives
        </h2>

        <div className="space-y-4">
          <AnimatePresence>
            {quests.map((quest) => (
              <motion.div
                key={quest.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass-panel p-4 border-l-4 transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                  quest.completed 
                    ? 'border-l-white/10 opacity-30 grayscale' 
                    : 'border-l-[#ff003c] hover:bg-[#ff003c]/5 hover:border-l-white hover:shadow-[0_0_15px_rgba(255,0,60,0.3)]'
                }`}
                onClick={(e) => handleStrike(e, quest.id)}
              >
                <div className="flex items-center gap-4">
                  <button className={`${quest.completed ? 'text-white/50' : 'text-[#ff003c] group-hover:text-white transition-colors'}`}>
                    {quest.completed ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                  </button>
                  <h3 className={`font-archivo-narrow text-xl ${quest.completed ? 'line-through text-white/50' : 'text-white'}`}>
                    {quest.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${quest.completed ? 'text-white/30' : 'text-[#ff003c]'}`} />
                  <span className={`font-space-mono font-bold ${quest.completed ? 'text-white/30' : 'text-[#ff003c]'}`}>
                    {quest.damage} DMG
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {isDefeated && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto mt-8 p-8 border-2 border-accent-blue bg-accent-blue/10 text-center shadow-neon-blue"
        >
          <Zap className="w-12 h-12 mx-auto text-accent-blue mb-4 animate-pulse" />
          <h2 className="font-orbitron text-3xl font-bold text-white uppercase tracking-widest mb-2">
            Victory Achieved
          </h2>
          <p className="font-space-mono text-accent-blue uppercase tracking-widest">
            10,000 XP Transferred to Core System.
          </p>
        </motion.div>
      )}

    </motion.div>
  );
}
