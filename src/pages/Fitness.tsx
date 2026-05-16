import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Dumbbell, Timer, Flame, Plus } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';

interface WorkoutLog {
  id: string;
  type: string;
  duration: number;
  intensity: string;
  xp_earned: number;
  date: string;
}

export default function Fitness() {
  const { addXpParticle } = useUIStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  
  // Form State
  const [type, setType] = useState('Weightlifting');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState('Medium');

  // Dummy Stat state for UI
  const [strengthXP, setStrengthXP] = useState(250);
  const [enduranceXP, setEnduranceXP] = useState(400);

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate XP: base * duration * intensity multiplier
    const base = 2;
    const multi = intensity === 'High' ? 1.5 : intensity === 'Medium' ? 1.0 : 0.7;
    const dur = parseInt(duration) || 0;
    const xpEarned = Math.round(base * dur * multi);

    const newLog: WorkoutLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration: dur,
      intensity,
      xp_earned: xpEarned,
      date: new Date().toLocaleDateString(),
    };

    setLogs([newLog, ...logs]);
    
    // Distribute XP
    if (type === 'Weightlifting') setStrengthXP(prev => prev + xpEarned);
    else if (type === 'Cardio') setEnduranceXP(prev => prev + xpEarned);
    else {
      setStrengthXP(prev => prev + Math.floor(xpEarned / 2));
      setEnduranceXP(prev => prev + Math.floor(xpEarned / 2));
    }

    // Visual Feedback
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success('Physical training data accepted.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue">
          <Activity className="w-8 h-8 text-accent-blue" />
        </div>
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
            Physical <span className="text-accent-blue">Conditioning</span>
          </h1>
          <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
            Build the vessel to wield the aura.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Logging Form */}
        <div className="xl:col-span-1 space-y-8">
          <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent-blue" />
              Log Training
            </h2>
            
            <form onSubmit={handleLogWorkout} className="space-y-6">
              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Regimen Type
                </label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                >
                  <option>Weightlifting</option>
                  <option>Cardio</option>
                  <option>Martial Arts</option>
                  <option>Calisthenics</option>
                  <option>Yoga</option>
                </select>
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-void border border-white/20 p-3 pl-10 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Intensity
                </label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setIntensity(level)}
                      className={`flex-1 py-2 font-space-mono text-xs uppercase tracking-widest border transition-all duration-300 ${intensity === level ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-void border-white/10 text-white/50 hover:border-white/30'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 mt-4">
                <Dumbbell className="w-5 h-5" />
                INITIATE TRANSFER
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Stats and History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Related Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatRing statName="Strength" level={Math.floor(strengthXP / 100) + 1} xp={strengthXP % 100} />
            <StatRing statName="Endurance" level={Math.floor(enduranceXP / 100) + 1} xp={enduranceXP % 100} />
          </div>

          {/* Log History */}
          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-[#ff5a00] pl-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#ff5a00]" />
              Training Archives
            </h2>
            
            {logs.length === 0 ? (
              <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
                No conditioning records found.
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id}
                      className="p-4 bg-void/50 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ff5a00]/10 flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-[#ff5a00]" />
                        </div>
                        <div>
                          <h3 className="font-archivo-narrow text-lg text-white">{log.type}</h3>
                          <p className="font-space-mono text-xs text-white/50">{log.date} • {log.intensity} Intensity</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                        <span className="font-space-mono text-sm text-white/70">{log.duration} MIN</span>
                        <span className="font-space-mono text-sm font-bold text-accent-blue bg-accent-blue/10 px-3 py-1">
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
  );
}
