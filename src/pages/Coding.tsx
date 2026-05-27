import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, Plus, GitPullRequest, GitBranch } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import { PomodoroTimer } from '../components/PomodoroTimer';
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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Active Session Timer Clock
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Generate dynamic fake commit preview hash when fields change
  const commitHashPreview = useMemo(() => {
    // Generate a beautiful deterministic or random-like commit preview based on fields
    const seed = `${type}-${duration}-${project}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hex = Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
    return hex.padEnd(6, 'F');
  }, [type, duration, project]);

  // Sum lines of code simulated
  const totalLinesCount = useMemo(() => {
    return logs.reduce((sum, log) => sum + (log.duration_minutes * 15), 0);
  }, [logs]);

  // Count up lines of code simulated
  const [displayedLines, setDisplayedLines] = useState(0);
  useEffect(() => {
    if (totalLinesCount === 0) return;
    let start = 0;
    const end = totalLinesCount;
    const durationMs = 1000;
    const stepTime = Math.max(Math.floor(durationMs / 50), 10);
    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setDisplayedLines(end);
        clearInterval(timer);
      } else {
        setDisplayedLines(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [totalLinesCount]);

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

  // ── TECH STACK ───────────────────────────────────────────────────────────
  const DEFAULT_STACK = ['TypeScript', 'React', 'Tailwind', 'Supabase', 'Vite', 'Python'];
  const stackKey = `monarch_tech_stack_${logs[0]?.user_id || 'local'}`;
  const [techStack, setTechStack] = useState<string[]>(() => {
    const saved = localStorage.getItem(stackKey);
    return saved ? JSON.parse(saved) : DEFAULT_STACK;
  });
  const [newTech, setNewTech] = useState('');
  const addTech = () => {
    if (!newTech.trim()) return;
    const updated = [...techStack, newTech.trim()];
    setTechStack(updated);
    localStorage.setItem(stackKey, JSON.stringify(updated));
    setNewTech('');
  };
  const removeTech = (tech: string) => {
    const updated = techStack.filter(t => t !== tech);
    setTechStack(updated);
    localStorage.setItem(stackKey, JSON.stringify(updated));
  };

  // ── KANBAN BOARD ──────────────────────────────────────────────────────────
  const kanbanKey = `monarch_kanban_${logs[0]?.user_id || 'local'}`;
  const [kanbanCards, setKanbanCards] = useState<Array<{id:string;title:string;col:'todo'|'doing'|'done'}>>(() => {
    const saved = localStorage.getItem(kanbanKey);
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Setup auth system', col: 'done' },
      { id: '2', title: 'Build activity logging', col: 'doing' },
      { id: '3', title: 'Analytics dashboard', col: 'todo' },
    ];
  });
  const [newCardTitle, setNewCardTitle] = useState('');
  const addKanbanCard = () => {
    if (!newCardTitle.trim()) return;
    const updated = [...kanbanCards, { id: Date.now().toString(), title: newCardTitle.trim(), col: 'todo' as const }];
    setKanbanCards(updated);
    localStorage.setItem(kanbanKey, JSON.stringify(updated));
    setNewCardTitle('');
  };
  const moveCard = (id: string, col: 'todo'|'doing'|'done') => {
    const updated = kanbanCards.map(c => c.id === id ? { ...c, col } : c);
    setKanbanCards(updated);
    localStorage.setItem(kanbanKey, JSON.stringify(updated));
  };
  const deleteCard = (id: string) => {
    const updated = kanbanCards.filter(c => c.id !== id);
    setKanbanCards(updated);
    localStorage.setItem(kanbanKey, JSON.stringify(updated));
  };

  // ── LEETCODE TRACKER ────────────────────────────────────────────────────────
  const lcKey = `monarch_lc_${logs[0]?.user_id || 'local'}`;
  const [lcStats, setLcStats] = useState<{easy:number;medium:number;hard:number}>(() => {
    const saved = localStorage.getItem(lcKey);
    return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0 };
  });
  const updateLc = (diff: 'easy'|'medium'|'hard', delta: number) => {
    const updated = { ...lcStats, [diff]: Math.max(0, lcStats[diff] + delta) };
    setLcStats(updated);
    localStorage.setItem(lcKey, JSON.stringify(updated));
  };
  const lcTotal = lcStats.easy + lcStats.medium + lcStats.hard;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 md:p-12 max-w-[1200px] mx-auto w-full space-y-8 relative"
    >
      {/* Scrollable low-opacity code matrix background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[4%]">
        <pre className="font-mono text-[9px] text-[#00D4FF] leading-tight w-full h-full select-none overflow-hidden py-10">
          {`// INTEL CORE DIGITAL TRANSFORMATION PROTOCOL
function initializeMonarchSystem() {
  const user = authenticateSession();
  const aura = calculateActiveAura();
  console.log("SYSTEM BOOTING... [OK]");
  
  while (true) {
    commitChanges();
    synthesizeXp();
    if (user.levelUp) {
      triggerAudioSystem();
      dispatchLevelOverlay();
    }
  }
}

// INTRUSION DETECTED OR SECURE BRIDGE ESTABLISHED
class SecurityGateway extends SystemDaemon {
  async filterPacket(pkt: SystemPacket) {
    if (pkt.source === "void") return PacketAction.DROP;
    return PacketAction.MERGE;
  }
}

// RECURSIVE REFACTORING ROUTINE
const calculateStatVelocity = (logs: ActivityLog[]) => {
  return logs.filter(l => l.stat === 'INT').map(l => l.xp);
};`}
        </pre>
      </div>

      {/* Header ZONE with Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-void border border-accent-blue flex items-center justify-center shadow-neon-blue">
            <Terminal className="w-8 h-8 text-accent-blue animate-pulse" />
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

        {/* Live Session Clock */}
        <div className="glass-panel px-4 py-2 border border-accent-blue/30 flex flex-col items-end md:items-end justify-center self-start md:self-auto bg-void/50">
          <span className="font-space-mono text-[9px] text-accent-blue/70 uppercase tracking-widest font-bold">
            ACTIVE SESSION
          </span>
          <span className="font-space-mono text-lg font-bold text-white tracking-widest mt-0.5">
            {formatTimer(secondsElapsed)}
          </span>
        </div>
      </div>

      {/* ── TECH STACK TAGS ── */}
      <div className="glass-2 p-5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Active Tech Stack
          </h3>
          <span className="font-mono text-[9px] text-white/30">{techStack.length} technologies</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {techStack.map(tech => (
            <motion.span
              key={tech}
              whileHover={{ scale: 1.05 }}
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/25 text-cyan-300 font-mono text-[10px] font-bold rounded cursor-pointer hover:border-cyan-500/60 transition-all"
            >
              {tech}
              <button onClick={() => removeTech(tech)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-400 transition-opacity ml-1 text-xs font-bold">×</button>
            </motion.span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTech}
            onChange={e => setNewTech(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
            placeholder="Add technology..."
            className="flex-1 bg-black/30 border border-white/10 text-white font-mono text-xs px-3 py-2 rounded focus:border-cyan-500/50 focus:outline-none"
          />
          <button onClick={addTech} className="px-3 py-2 bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-950/50 transition-all">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <div className="glass-2 p-5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <GitPullRequest className="w-3.5 h-3.5 text-purple-400" /> Project Kanban
          </h3>
          <div className="flex gap-2">
            <input
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKanbanCard())}
              placeholder="New task..."
              className="bg-black/30 border border-white/10 text-white font-mono text-xs px-3 py-1.5 rounded focus:border-purple-500/50 focus:outline-none"
            />
            <button onClick={addKanbanCard} className="px-2 py-1.5 bg-purple-950/30 border border-purple-500/30 text-purple-400 font-mono text-xs rounded hover:bg-purple-950/50 transition-all">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['todo', 'doing', 'done'] as const).map(col => {
            const colors = col === 'todo' ? 'border-white/10 text-white/40' : col === 'doing' ? 'border-amber-500/30 text-amber-400' : 'border-green-500/30 text-green-400';
            const colCards = kanbanCards.filter(c => c.col === col);
            return (
              <div key={col} className={`p-3 rounded-lg bg-black/30 border ${colors}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest">{col === 'todo' ? 'To Do' : col === 'doing' ? 'In Progress' : 'Done'}</span>
                  <span className="font-mono text-[8px] opacity-60">{colCards.length}</span>
                </div>
                <div className="space-y-1.5 min-h-[60px]">
                  <AnimatePresence>
                    {colCards.map(card => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group p-2 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-white/70 flex items-center justify-between gap-1 hover:border-white/20 transition-all cursor-pointer"
                      >
                        <span>{card.title}</span>
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 transition-opacity">
                          {col !== 'todo' && <button onClick={() => moveCard(card.id, col === 'doing' ? 'todo' : 'doing')} className="text-white/30 hover:text-white/70">←</button>}
                          {col !== 'done' && <button onClick={() => moveCard(card.id, col === 'todo' ? 'doing' : 'done')} className="text-white/30 hover:text-white/70">→</button>}
                          <button onClick={() => deleteCard(card.id)} className="text-red-400/50 hover:text-red-400">×</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LEETCODE TRACKER ── */}
      <div className="glass-2 p-5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-amber-400" /> LeetCode Progress
          </h3>
          <div className="font-mono text-sm font-bold text-white">
            {lcTotal} <span className="text-white/30 text-[10px]">problems solved</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {([
            { key: 'easy', label: 'Easy', color: '#10B981', text: 'text-emerald-400' },
            { key: 'medium', label: 'Medium', color: '#F59E0B', text: 'text-amber-400' },
            { key: 'hard', label: 'Hard', color: '#EF4444', text: 'text-red-400' },
          ] as const).map(d => (
            <div key={d.key} className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-white/5 rounded-lg">
              <span className={`font-mono text-3xl font-black ${d.text}`}>{lcStats[d.key]}</span>
              <span className="font-mono text-[9px] text-white/40 uppercase">{d.label}</span>
              <div className="flex gap-1">
                <button onClick={() => updateLc(d.key, -1)} className={`w-7 h-7 rounded border border-white/10 text-white/40 hover:text-white text-xs transition-all`}>−</button>
                <button onClick={() => updateLc(d.key, 1)} className={`w-7 h-7 rounded font-bold text-xs transition-all`} style={{ background: `${d.color}22`, border: `1px solid ${d.color}44`, color: d.color }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Logging Form */}
        <div className="xl:col-span-1 space-y-6">
          {/* Pomodoro Focus Timer */}
          <PomodoroTimer className="" />

          <div className="glass-panel p-6 border-t-2 border-t-accent-blue relative bg-void/40">
            <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-blue">
              <Plus className="w-5 h-5" />
              Commit Code
            </h2>
            
            <form onSubmit={handleLogCode} className="space-y-6">
              
              {/* Session Type with >_ prefix */}
              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Session Type
                </label>
                <div className="flex items-center bg-void/60 border border-white/10 focus-within:border-accent-blue/60 transition-colors rounded p-1">
                  <span className="font-space-mono text-accent-blue/50 text-sm px-2 select-none">&gt;_</span>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="flex-1 bg-transparent border-0 border-none text-white font-archivo-narrow text-sm focus:ring-0 focus:outline-none py-2 px-1 w-full"
                    style={{ background: 'transparent' }}
                  >
                    <option className="bg-[#0a0a0f] text-white" value="Feature Development">Feature Development</option>
                    <option className="bg-[#0a0a0f] text-white" value="Bug Fixing">Bug Fixing</option>
                    <option className="bg-[#0a0a0f] text-white" value="Refactoring">Refactoring</option>
                    <option className="bg-[#0a0a0f] text-white" value="Algorithms">Algorithms</option>
                    <option className="bg-[#0a0a0f] text-white" value="UI/UX Implementation">UI/UX Implementation</option>
                  </select>
                </div>
              </div>

              {/* Project Name with Blinking Cursor on Focus */}
              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Project Name
                </label>
                <div className="flex items-center bg-void/60 border border-white/10 focus-within:border-accent-blue/60 transition-colors rounded p-1 relative">
                  <span className="font-space-mono text-accent-blue/50 text-sm px-2 select-none">&gt;_</span>
                  <input 
                    type="text" 
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    onFocus={() => setFocusedInput('project')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="e.g. Core API"
                    className="flex-1 bg-transparent border-0 border-none text-white font-archivo-narrow text-sm focus:ring-0 focus:outline-none py-2 px-1 w-full"
                  />
                  {focusedInput === 'project' && (
                    <span className="absolute right-3 font-space-mono text-accent-blue text-sm animate-pulse">▋</span>
                  )}
                </div>
              </div>

              {/* Duration with >_ prefix */}
              <div>
                <label className="block font-space-mono text-xs text-white/50 tracking-widest uppercase mb-2">
                  Duration (Minutes)
                </label>
                <div className="flex items-center bg-void/60 border border-white/10 focus-within:border-accent-blue/60 transition-colors rounded p-1">
                  <span className="font-space-mono text-accent-blue/50 text-sm px-2 select-none">&gt;_</span>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="flex-1 bg-transparent border-0 border-none text-white font-archivo-narrow text-sm focus:ring-0 focus:outline-none py-2 px-1 w-full"
                  />
                </div>
              </div>

              {/* Live Commit Hash Preview & Live Payload XP */}
              <div className="border border-accent-blue/20 bg-accent-blue/5 p-3.5 rounded space-y-1.5 font-space-mono text-xs">
                <div className="flex items-center justify-between text-white/40">
                  <span>COMMIT PREVIEW:</span>
                  <span className="text-accent-blue tracking-widest font-bold font-space-mono">
                    FEAT-{commitHashPreview}
                  </span>
                </div>
                <div className="flex items-center justify-between text-white/40">
                  <span>PAYLOAD SIZE:</span>
                  <span className="text-white font-bold">
                    +{Math.round((parseInt(duration) || 0) * 2.5)} XP
                  </span>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform duration-100 scanline-btn-effect">
                <Code2 className="w-5 h-5" />
                EXECUTE COMMIT
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Stats and History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Top segment: Stat Rings and Total Lines Forged counter card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stat rings */}
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-void/50 border border-white/5 md:col-span-1">
              <StatRing statName="Intelligence" level={intelligenceStat.level} xp={intelligenceStat.xp % 100} />
            </div>
            
            <div className="glass-panel p-4 flex flex-col items-center justify-center bg-void/50 border border-white/5 md:col-span-1">
              <StatRing statName="Creativity" level={creativityStat.level} xp={creativityStat.xp % 100} />
            </div>

            {/* Total Lines Forged count-up card */}
            <div className="glass-panel p-5 flex flex-col justify-center bg-void/50 border border-accent-blue/30 md:col-span-1 relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-blue to-transparent" />
              <span className="font-space-mono text-[9px] text-white/40 uppercase tracking-widest">
                LINES OF CODE SIMULATED
              </span>
              <span className="font-orbitron text-5xl font-black text-accent-blue tracking-tight mt-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
                {displayedLines.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Repository History */}
          <div className="glass-panel p-6 border border-white/5 relative bg-void/30">
            
            {/* Ruled separator header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-accent-blue" />
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest text-white">
                Repository History
              </h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            
            {logs.length === 0 ? (
              <EmptyState
                icon={Code2}
                title="No commits found in active branch"
                description="Your engineering history is clear. Commit your first lines of code to log physical progress in intelligence and creativity."
              />
            ) : (
              <div className="relative pl-6">
                
                {/* Git Graph vertical branch line */}
                <div className="absolute left-2.5 top-2.5 bottom-2 w-px bg-accent-blue/20" />

                <div className="space-y-4">
                  <AnimatePresence>
                    {logs.map((log, index) => {
                      const isFeature = log.activity_type.toLowerCase().includes('feature') || log.activity_type.toLowerCase().includes('algorithm');
                      const shortHash = log.id.slice(0, 6).toUpperCase();
                      
                      return (
                        <div key={log.id} className="relative flex items-start gap-4">
                          
                          {/* Circle git node node (filled for feature/refactor, hollow for bugfix) */}
                          <div className={`absolute -left-[20px] top-2 w-2.5 h-2.5 rounded-full border border-accent-blue transition-colors flex items-center justify-center ${
                            isFeature ? 'bg-accent-blue shadow-[0_0_8px_rgba(0,212,255,0.7)]' : 'bg-void'
                          }`} />

                          <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex-1 p-4 bg-void/50 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-l-4 hover:border-l-accent-blue transition-all duration-200"
                          >
                            <div className="flex items-start md:items-center gap-3">
                              <div className="w-9 h-9 bg-accent-blue/10 flex items-center justify-center rounded">
                                {isFeature ? <GitBranch className="w-4 h-4 text-accent-blue" /> : <GitPullRequest className="w-4 h-4 text-accent-blue/70" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-space-mono text-xs text-accent-blue/50 tracking-wider font-bold">
                                    [{shortHash}]
                                  </span>
                                  <h3 className="font-archivo-narrow text-base text-white">
                                    {log.metadata?.project || 'Monarch Core'}
                                  </h3>
                                  <span className="bg-accent-blue/10 border border-accent-blue/30 px-2 py-0.5 text-[9px] font-space-mono text-accent-blue/80 rounded-full">
                                    {log.activity_type}
                                  </span>
                                  {isFeature && (
                                    <span className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-space-mono text-emerald-400 font-bold rounded">
                                      MERGE
                                    </span>
                                  )}
                                </div>
                                <p className="font-space-mono text-[10px] text-white/30 mt-0.5">
                                  {new Date(log.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                              <span className="font-space-mono text-xs text-white/50 uppercase tracking-widest">
                                {log.duration_minutes} MIN
                              </span>
                              <span className="font-space-mono text-xs font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-1">
                                +{log.xp_earned} XP
                              </span>
                            </div>
                          </motion.div>

                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
