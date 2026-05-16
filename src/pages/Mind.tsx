import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BrainCircuit, Lock, ScrollText } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import { MonkModeOverlay } from '../components/MonkModeOverlay';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';

export default function Mind() {
  const { addXpParticle, triggerLevelUp } = useUIStore();
  const { logs, addLog } = useActivityLogs('mind');
  const { stats } = useProfile();
  
  // Monk Mode State
  const [isMonkMode, setIsMonkMode] = useState(false);
  const [monkTarget, setMonkTarget] = useState(60);

  // Form State
  const [type, setType] = useState('Meditation');
  const [duration, setDuration] = useState('20');

  // Helper to get real stats
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };

  const stoicismStat = getStat('stoicism');
  const focusStat = getStat('focus');

  const processXpGain = async (typeStr: string, durMins: number, isMonk = false) => {
    // Calculate XP: base * duration
    const base = 2;
    let xpEarned = Math.round(base * durMins);
    if (isMonk) xpEarned = Math.round(xpEarned * 1.5); // Monk mode bonus
    
    let statCategories = [];
    if (typeStr === 'Meditation' || typeStr === 'Journaling') statCategories = ['stoicism'];
    else if (typeStr === 'Deep Work' || typeStr === 'Deep Reading') statCategories = ['focus'];
    else statCategories = ['stoicism', 'focus'];

    await addLog(typeStr + (isMonk ? ' (Monk Mode)' : ''), durMins, xpEarned, { isMonk }, statCategories);

    return xpEarned;
  };

  const handleLogManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(duration) || 0;
    const xp = await processXpGain(type, dur);
    
    // Visual Feedback
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xp);
    toast.success('Cognitive data integrated.');
  };

  const handleMonkModeClose = async (completed: boolean, actualDuration: number) => {
    setIsMonkMode(false);
    if (completed) {
      const xp = await processXpGain('Deep Focus', actualDuration, true);
      // Trigger particles from center
      addXpParticle(window.innerWidth / 2, window.innerHeight / 2, xp);
      toast.success('Monk Mode completed. Mind expanded.', { icon: '🧠' });
      
      // 20% chance to trigger level up from Monk Mode
      if (Math.random() > 0.8) {
        setTimeout(triggerLevelUp, 1500);
      }
    } else {
      if (actualDuration > 0) {
        const xp = await processXpGain('Partial Focus', actualDuration, false);
        toast(`Partial focus logged. ${xp} XP recovered.`);
      }
    }
  };

  return (
    <>
      <MonkModeOverlay 
        isActive={isMonkMode} 
        onClose={handleMonkModeClose} 
        targetMinutes={monkTarget} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue">
            <Brain className="w-8 h-8 text-accent-blue" />
          </div>
          <div>
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
              Mental <span className="text-accent-blue">Fortitude</span>
            </h1>
            <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
              Control the mind, conquer the system.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Logging & Monk Mode */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Monk Mode Initiator */}
            <div className="glass-panel p-6 border-t-2 border-t-accent-purple shadow-neon-purple relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-accent-purple">
                <Lock className="w-5 h-5" />
                Monk Mode
              </h2>
              <p className="font-space-mono text-xs text-white/60 mb-6">
                Enter total lockdown. Extreme focus protocol. Yields 1.5x XP multiplier.
              </p>
              
              <div className="flex items-center gap-4 mb-6">
                <input 
                  type="range" 
                  min="10" 
                  max="120" 
                  step="10"
                  value={monkTarget}
                  onChange={(e) => setMonkTarget(parseInt(e.target.value))}
                  className="flex-1 accent-accent-purple"
                />
                <span className="font-orbitron font-bold text-xl text-white w-16 text-right">
                  {monkTarget}m
                </span>
              </div>

              <button 
                onClick={() => setIsMonkMode(true)}
                className="w-full btn-primary bg-transparent border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-void py-4 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 15px rgba(184, 41, 227, 0.3)' }}
              >
                <BrainCircuit className="w-5 h-5" />
                INITIATE LOCKDOWN
              </button>
            </div>

            {/* Manual Entry Form */}
            <div className="glass-panel p-6">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-accent-blue" />
                Manual Log
              </h2>
              
              <form onSubmit={handleLogManual} className="space-y-6">
                <div>
                  <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                    Discipline Type
                  </label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                  >
                    <option>Meditation</option>
                    <option>Deep Work</option>
                    <option>Deep Reading</option>
                    <option>Journaling</option>
                    <option>Visualization</option>
                  </select>
                </div>

                <div>
                  <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                    Duration (Minutes)
                  </label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                  />
                </div>

                <button type="submit" className="w-full btn-ghost py-3 flex items-center justify-center gap-2 mt-4 text-sm">
                  Log Entry
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Stats and History */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Related Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatRing statName="Stoicism" level={stoicismStat.level} xp={stoicismStat.xp % 100} />
              <StatRing statName="Focus" level={focusStat.level} xp={focusStat.xp % 100} />
            </div>

            {/* Log History */}
            <div className="glass-panel p-6">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-accent-blue pl-3">
                Mind Archives
              </h2>
              
              {logs.length === 0 ? (
                <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
                  Mind is a blank slate.
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {logs.map((log) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={log.id}
                        className="p-4 bg-void/50 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-accent-blue/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center ${log.activity_type.includes('Monk') ? 'bg-accent-purple/10' : 'bg-accent-blue/10'}`}>
                            <Brain className={`w-5 h-5 ${log.activity_type.includes('Monk') ? 'text-accent-purple' : 'text-accent-blue'}`} />
                          </div>
                          <div>
                            <h3 className="font-archivo-narrow text-lg text-white">{log.activity_type}</h3>
                            <p className="font-space-mono text-xs text-white/50">{new Date(log.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                          <span className="font-space-mono text-sm text-white/70">{log.duration_minutes} MIN</span>
                          <span className={`font-space-mono text-sm font-bold px-3 py-1 ${log.activity_type.includes('Monk') ? 'text-accent-purple bg-accent-purple/10' : 'text-accent-blue bg-accent-blue/10'}`}>
                            +{log.xp_earned} XP
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
}
