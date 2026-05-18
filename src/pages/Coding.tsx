import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, GitMerge, Plus } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';
import { EmptyState } from '../components/ui/EmptyState';

export default function Coding() {
  const { addXpParticle } = useUIStore();
  const { logs, addLog } = useActivityLogs('coding');
  const { stats } = useProfile();
  
  // Form State
  const [type, setType] = useState('Feature Development');
  const [duration, setDuration] = useState('60');
  const [project, setProject] = useState('Monarch System');

  // Helper to get real stats
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };

  const intelligenceStat = getStat('intelligence');
  const creativityStat = getStat('creativity');

  const handleLogCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate XP
    const base = 2.5;
    const dur = parseInt(duration) || 0;
    const xpEarned = Math.round(base * dur);

    let statCategories = [];
    if (type === 'Algorithms' || type === 'Refactoring') statCategories = ['intelligence'];
    else if (type === 'UI/UX Implementation') statCategories = ['creativity'];
    else statCategories = ['intelligence', 'creativity'];

    await addLog(type, dur, xpEarned, { project }, statCategories);

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
            <StatRing statName="Intelligence" level={intelligenceStat.level} xp={intelligenceStat.xp % 100} />
            <StatRing statName="Creativity" level={creativityStat.level} xp={creativityStat.xp % 100} />
          </div>

          {/* Log History */}
          <div className="glass-panel p-6">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 border-l-4 border-accent-blue pl-3 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-accent-blue" />
              Repository History
            </h2>
            
            {logs.length === 0 ? (
              <EmptyState
                icon={Code2}
                title="No commits found in active branch"
                description="Your engineering history is clear. Commit your first lines of code to log physical progress in intelligence and creativity."
              />
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
                          <h3 className="font-archivo-narrow text-lg text-white">{log.metadata?.project || 'Unknown Project'}</h3>
                          <p className="font-space-mono text-xs text-white/50">{new Date(log.created_at).toLocaleDateString()} • {log.activity_type}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                        <span className="font-space-mono text-sm text-white/70">{log.duration_minutes} MIN</span>
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
