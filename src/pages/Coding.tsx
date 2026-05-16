import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, GitMerge, Plus } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';

interface CodeLog {
  id: string;
  type: string;
  duration: number;
  xp_earned: number;
  date: string;
  project: string;
}

export default function Coding() {
  const { addXpParticle } = useUIStore();
  const [logs, setLogs] = useState<CodeLog[]>([]);
  
  // Form State
  const [type, setType] = useState('Feature Development');
  const [duration, setDuration] = useState('60');
  const [project, setProject] = useState('Monarch System');

  // Dummy Stat state for UI
  const [intelligenceXP, setIntelligenceXP] = useState(1200);
  const [creativityXP, setCreativityXP] = useState(950);

  const handleLogCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate XP
    const base = 2.5;
    const dur = parseInt(duration) || 0;
    const xpEarned = Math.round(base * dur);

    const newLog: CodeLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration: dur,
      xp_earned: xpEarned,
      date: new Date().toLocaleDateString(),
      project
    };

    setLogs([newLog, ...logs]);
    
    // Distribute XP
    if (type === 'Algorithms' || type === 'Refactoring') setIntelligenceXP(prev => prev + xpEarned);
    else if (type === 'UI/UX Implementation') setCreativityXP(prev => prev + xpEarned);
    else {
      setIntelligenceXP(prev => prev + Math.floor(xpEarned * 0.7));
      setCreativityXP(prev => prev + Math.floor(xpEarned * 0.3));
    }

    // Visual Feedback
    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success('Code merged. Intelligence augmented.', { icon: '💻' });
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
          <Terminal className="w-8 h-8 text-accent-blue" />
        </div>
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white">
            Software <span className="text-accent-blue">Engineering</span>
          </h1>
          <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase mt-1">
            Build systems. Automate reality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Logging Form */}
        <div className="xl:col-span-1 space-y-8">
          <div className="glass-panel p-6 border-t-2 border-t-accent-blue">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent-blue" />
              Commit Code
            </h2>
            
            <form onSubmit={handleLogCode} className="space-y-6">
              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Session Type
                </label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                >
                  <option>Feature Development</option>
                  <option>Bug Fixing</option>
                  <option>Refactoring</option>
                  <option>Algorithms</option>
                  <option>UI/UX Implementation</option>
                </select>
              </div>

              <div>
                <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                  Project Name
                </label>
                <input 
                  type="text" 
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Core API"
                  className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                />
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

              <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 mt-4">
                <Code2 className="w-5 h-5" />
                EXECUTE COMMIT
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Stats and History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Related Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatRing statName="Intelligence" level={Math.floor(intelligenceXP / 100) + 1} xp={intelligenceXP % 100} />
            <StatRing statName="Creativity" level={Math.floor(creativityXP / 100) + 1} xp={creativityXP % 100} />
          </div>

          {/* Log History */}
          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-accent-blue pl-3 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-accent-blue" />
              Repository History
            </h2>
            
            {logs.length === 0 ? (
              <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
                No commits found in the current branch.
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
                        <div className="w-10 h-10 bg-accent-blue/10 flex items-center justify-center">
                          <Code2 className="w-5 h-5 text-accent-blue" />
                        </div>
                        <div>
                          <h3 className="font-archivo-narrow text-lg text-white">{log.project}</h3>
                          <p className="font-space-mono text-xs text-white/50">{log.date} • {log.type}</p>
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
