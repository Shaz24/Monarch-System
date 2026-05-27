import { motion, AnimatePresence } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../hooks/useTasks';
import { useProfile } from '../hooks/useProfile';
import {
  Loader2, UploadCloud, Plus, Calendar, X, ShieldAlert as ShieldIcon,
  CheckCircle2, LayoutGrid, List, Clock, Target, Flame, Zap, Award
} from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';
import { sounds } from '../lib/sound';

const PRESET_TEMPLATES = {
  'Monk Mode': [
    { time_slot: '05:00', title: 'Awakening Cold Shower', stat_category: 'discipline', difficulty: 'C', xp_reward: 40 },
    { time_slot: '06:00', title: 'Meditate / Mindful Breathwork', stat_category: 'stoicism', difficulty: 'B', xp_reward: 60 },
    { time_slot: '08:00', title: 'Deep Focus Coding Blocks', stat_category: 'intelligence', difficulty: 'A', xp_reward: 80 },
    { time_slot: '17:00', title: 'High Intensity Tactical Run', stat_category: 'endurance', difficulty: 'A', xp_reward: 80 }
  ],
  'Physical Cultivation': [
    { time_slot: '06:00', title: 'Morning Cardio Conditioning', stat_category: 'endurance', difficulty: 'A', xp_reward: 80 },
    { time_slot: '12:00', title: 'Caloric Prep & Macros Nutrition', stat_category: 'consistency', difficulty: 'C', xp_reward: 40 },
    { time_slot: '17:00', title: 'Strength Protocol PR Attempt', stat_category: 'strength', difficulty: 'S', xp_reward: 100 },
    { time_slot: '21:00', title: 'Muscle Rejuvenation Stretch', stat_category: 'discipline', difficulty: 'D', xp_reward: 20 }
  ],
  'Deep Work Master': [
    { time_slot: '08:00', title: 'System Architecture Design', stat_category: 'intelligence', difficulty: 'A', xp_reward: 80 },
    { time_slot: '10:00', title: 'Bug Debugging & Refactoring', stat_category: 'focus', difficulty: 'B', xp_reward: 60 },
    { time_slot: '14:00', title: 'Creative Layout Prototyping', stat_category: 'creativity', difficulty: 'C', xp_reward: 40 },
    { time_slot: '16:00', title: 'Monetization Launch Prep', stat_category: 'wealth', difficulty: 'S', xp_reward: 100 }
  ]
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  strength:     { text: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  discipline:   { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  intelligence: { text: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30' },
  creativity:   { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  endurance:    { text: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30' },
  charisma:     { text: 'text-pink-400',   bg: 'bg-pink-500/15',   border: 'border-pink-500/30' },
  focus:        { text: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  stoicism:     { text: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  wealth:       { text: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  consistency:  { text: 'text-teal-400',   bg: 'bg-teal-500/15',   border: 'border-teal-500/30' },
};

const RANK_COLORS: Record<string, string> = {
  S: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  A: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  B: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  C: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  D: 'text-white/50 bg-white/5 border-white/10',
  E: 'text-white/30 bg-white/[0.03] border-white/5',
};

const validCategories = [
  'strength', 'discipline', 'intelligence', 'creativity',
  'endurance', 'charisma', 'focus', 'stoicism', 'wealth', 'consistency'
];

// Time slot to hour number
const timeToHour = (slot: string) => {
  const [h] = (slot || '00:00').split(':').map(Number);
  return isNaN(h) ? 0 : h;
};

export default function Schedule() {
  const { tasks, completedTaskIds, loading, completeTask, addTask, updateTask, deleteTask } = useTasks();
  const { profile, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [newTimeSlot, setNewTimeSlot] = useState('12:00');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('discipline');
  const [newDifficulty, setNewDifficulty] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('D');

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Tabbed category filter
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRank, setFilterRank] = useState<string>('all');

  // Shield
  const [streakFreezes, setStreakFreezes] = useState<number>(() => parseInt(localStorage.getItem('monarch_streak_freezes') || '0', 10));
  const [shieldActive, setShieldActive] = useState<boolean>(() => localStorage.getItem('monarch_shield_active') === 'true');

  useEffect(() => { localStorage.setItem('monarch_streak_freezes', streakFreezes.toString()); }, [streakFreezes]);
  useEffect(() => { localStorage.setItem('monarch_shield_active', shieldActive.toString()); }, [shieldActive]);

  const autoRankTask = (title: string) => {
    const t = title.toLowerCase();
    let difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' = 'D';
    let xp = 20;
    if (t.includes('marathon') || t.includes('extreme') || t.includes('boss')) { difficulty = 'S'; xp = 100; }
    else if (t.includes('deep') || t.includes('workout') || t.includes('code') || t.includes('build')) { difficulty = 'A'; xp = 80; }
    else if (title.length > 30 || t.includes('study') || t.includes('read')) { difficulty = 'B'; xp = 60; }
    else if (title.length > 15) { difficulty = 'C'; xp = 40; }
    else if (title.length < 5) { difficulty = 'E'; xp = 10; }
    return { difficulty, xp_reward: xp };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      let addedCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (i === 0 && lines[0].toLowerCase().includes('time')) continue;
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const time_slot = parts[0];
          const title = parts[1];
          let stat_category = parts[2] ? parts[2].toLowerCase() : 'discipline';
          if (!validCategories.includes(stat_category)) stat_category = 'discipline';
          const { difficulty, xp_reward } = autoRankTask(title);
          await addTask({ time_slot, title, stat_category, difficulty, xp_reward, is_recurring: true });
          addedCount++;
        }
      }
      toast.success(`${addedCount} directives uploaded and auto-ranked.`, { icon: '📝' });
    } catch (error: any) {
      toast.error(`Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    const xpMap = { S: 100, A: 80, B: 60, C: 40, D: 20, E: 10 };
    addTask({ time_slot: newTimeSlot, title: newTitle, stat_category: newCategory, difficulty: newDifficulty, xp_reward: xpMap[newDifficulty], is_recurring: true });
    setIsAddModalOpen(false);
    toast.success('Directive scheduled.');
  };

  const handleBuyShield = async (currency: 'xp' | 'aura') => {
    if (!profile) return;
    if (currency === 'xp') {
      if (profile.current_xp < 500) { toast.error('Insufficient XP (requires 500 XP)'); return; }
      await updateProfile({ current_xp: profile.current_xp - 500 });
      setStreakFreezes(prev => prev + 1);
      sounds.playFanfare();
      toast.success('Shield purchased! (-500 XP)');
    } else {
      if ((profile.aura_level ?? 100) < 100) { toast.error('Insufficient Aura (requires 100 Aura)'); return; }
      await updateProfile({ aura_level: Math.max(0, (profile.aura_level ?? 100) - 100) });
      setStreakFreezes(prev => prev + 1);
      sounds.playFanfare();
      toast.success('Shield purchased! (-100 Aura)');
    }
  };

  const handleToggleShield = () => {
    if (shieldActive) { setShieldActive(false); toast('Shield deactivated.', { icon: '🛡️' }); }
    else {
      if (streakFreezes <= 0) { toast.error('No shields in inventory!'); return; }
      setStreakFreezes(prev => prev - 1);
      setShieldActive(true);
      sounds.playChime();
      toast.success('Shield activated! Streak secured.', { icon: '🛡️' });
    }
  };

  const handleLoadTemplate = async (templateName: keyof typeof PRESET_TEMPLATES) => {
    const templateTasks = PRESET_TEMPLATES[templateName];
    setIsTemplateModalOpen(false);
    toast.loading(`Seeding ${templateName}...`, { duration: 1000 });
    for (const t of templateTasks) {
      await addTask({ time_slot: t.time_slot, title: t.title, stat_category: t.stat_category, difficulty: t.difficulty as any, xp_reward: t.xp_reward, is_recurring: true });
    }
    toast.success(`${templateName} directives loaded!`);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchCat = filterCategory === 'all' || task.stat_category.toLowerCase() === filterCategory.toLowerCase();
      const matchRank = filterRank === 'all' || task.difficulty === filterRank;
      return matchCat && matchRank;
    });
  }, [tasks, filterCategory, filterRank]);

  // Progress summary
  const completedToday = completedTaskIds.size;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  const totalXpPotential = tasks.reduce((s, t) => s + t.xp_reward, 0);
  const earnedXp = tasks.filter(t => completedTaskIds.has(t.id)).reduce((s, t) => s + t.xp_reward, 0);

  // Timeline view: group tasks by hour
  const timelineGroups = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => timeToHour(a.time_slot) - timeToHour(b.time_slot));
    const groups: Record<number, typeof tasks> = {};
    sorted.forEach(t => {
      const h = timeToHour(t.time_slot);
      if (!groups[h]) groups[h] = [];
      groups[h].push(t);
    });
    return groups;
  }, [filteredTasks]);

  // Active categories in tasks for filter pills
  const activeCategories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.stat_category.toLowerCase()));
    return ['all', ...validCategories.filter(c => cats.has(c))];
  }, [tasks]);

  if (loading) {
    return (
      <div className="p-4 md:p-12 max-w-[1000px] mx-auto w-full space-y-8">
        <div className="h-10 w-64 bg-white/5 rounded animate-pulse" />
        <div className="space-y-4 mt-8"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }}
      className="p-4 md:p-12 max-w-[1100px] mx-auto w-full space-y-6 relative"
    >
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(129,140,248,0.15)]">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-orbitron text-3xl md:text-4xl font-bold uppercase tracking-widest text-white">
                Daily <span className="text-indigo-400">Directives</span>
              </h1>
              <p className="font-mono text-xs text-white/35 tracking-widest uppercase mt-0.5">
                Failure to complete reduces aura. Proceed with discipline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn-ghost py-2 px-3 flex items-center gap-2 text-xs border border-accent-purple/20 text-[#A78BFA]"
          >
            <Award className="w-4 h-4" /> Presets
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="btn-ghost py-2 px-3 flex items-center gap-2 text-xs">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary py-2 px-4 flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Add Directive
          </button>
        </div>
      </div>

      {/* ── PROGRESS SUMMARY BAR ── */}
      <div className="glass-2 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-monarch to-cyan-500 flex items-center justify-center text-white font-bold font-mono text-sm">
              {progressPercent}%
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white">{completedToday} of {totalTasks} Directives Complete</p>
              <p className="font-mono text-[10px] text-white/40 mt-0.5">{earnedXp} / {totalXpPotential} XP earned today</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-amber-400"><Flame className="w-3 h-3" />{completedToday} done</span>
            <span className="flex items-center gap-1 text-cyan-400"><Zap className="w-3 h-3" />+{earnedXp} XP</span>
            <span className="flex items-center gap-1 text-white/40"><Target className="w-3 h-3" />{totalTasks - completedToday} left</span>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-monarch to-cyan-400 rounded-full"
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* ── STREAK FREEZE SHIELD ── */}
      <div className="glass-2 p-5 border-l-4 border-indigo-400 bg-indigo-400/5 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg bg-black/40 border transition-all ${shieldActive ? 'border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-400' : 'border-white/10 text-white/40'}`}>
            <ShieldIcon className={`w-6 h-6 ${shieldActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#F1F5F9] flex items-center gap-2">
              Streak Freeze Shield
              {shieldActive && <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold animate-pulse">ACTIVE</span>}
            </h3>
            <p className="font-mono text-xs text-white/50 mt-0.5">Protects streak if you miss objectives for up to 24h.</p>
            <div className="mt-1 font-mono text-[10px] text-[#A78BFA]">
              Inventory: <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">{streakFreezes} SHIELDS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleToggleShield}
            className={`px-3 py-2 text-xs font-mono font-bold border transition-all ${shieldActive ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}
          >
            {shieldActive ? 'DEACTIVATE' : 'ACTIVATE'}
          </button>
          <div className="flex flex-col gap-1">
            <button onClick={() => handleBuyShield('xp')} className="px-2 py-1 bg-black/40 border border-white/10 hover:border-white/20 text-[9px] font-mono text-white/70 uppercase tracking-widest transition-all hover:text-white">Buy: 500 XP</button>
            <button onClick={() => handleBuyShield('aura')} className="px-2 py-1 bg-black/40 border border-white/10 hover:border-white/20 text-[9px] font-mono text-[#A78BFA] uppercase tracking-widest transition-all hover:text-white">Buy: 100 Aura</button>
          </div>
        </div>
      </div>

      {/* ── FILTER PILLS + VIEW TOGGLE ── */}
      <div className="glass-1 p-4 space-y-3">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {activeCategories.map(cat => {
            const colors = cat !== 'all' ? CATEGORY_COLORS[cat] : null;
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${
                  isActive
                    ? cat === 'all'
                      ? 'pill-tab-active text-white border-monarch/50'
                      : `${colors?.bg} ${colors?.text} ${colors?.border}`
                    : 'bg-white/[0.03] text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Rank filter + view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {['all', 'S', 'A', 'B', 'C', 'D', 'E'].map(rank => (
              <button
                key={rank}
                onClick={() => setFilterRank(rank)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                  filterRank === rank
                    ? rank !== 'all' ? RANK_COLORS[rank] : 'pill-tab-active text-white border-monarch/50'
                    : 'bg-transparent text-white/30 border-white/10 hover:text-white/60'
                }`}
              >
                {rank === 'all' ? 'ALL' : rank}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-monarch/20 text-[#A78BFA]' : 'text-white/30 hover:text-white/60'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 transition-colors ${viewMode === 'timeline' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/30 hover:text-white/60'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TASK LIST / TIMELINE ── */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <EmptyState icon={Calendar} title="No Directives Established" description="Select a preset or create a custom training protocol." />
          ) : (
            <AnimatePresence>
              {filteredTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.97 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TaskRow
                    task={task}
                    isCompleted={completedTaskIds.has(task.id)}
                    onComplete={() => completeTask(task.id, task.xp_reward)}
                    onUpdate={(updates) => updateTask(task.id, updates)}
                    onDelete={() => deleteTask(task.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white">Time-Block Timeline</h3>
          </div>
          {Object.keys(timelineGroups).length === 0 ? (
            <EmptyState icon={Clock} title="No Timed Directives" description="Add directives with time slots to see the timeline." />
          ) : (
            <div className="relative pl-12">
              {/* Vertical timeline line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-monarch/30 to-transparent" />

              {Array.from({ length: 24 }, (_, hour) => {
                const tasks = timelineGroups[hour] || [];
                if (tasks.length === 0 && !timelineGroups[hour]) return null;
                return (
                  <div key={hour} className="flex items-start gap-4 mb-3 min-h-[36px]">
                    {/* Hour label */}
                    <div className="absolute left-0 flex flex-col items-center">
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${tasks.length > 0 ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/10 bg-transparent'}`}>
                        {tasks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </div>
                      <span className="font-mono text-[8px] text-white/30 mt-0.5">{String(hour).padStart(2,'0')}:00</span>
                    </div>

                    {/* Task blocks */}
                    {tasks.length > 0 && (
                      <div className="flex flex-col gap-1.5 w-full mt-1">
                        {tasks.map(task => {
                          const colors = CATEGORY_COLORS[task.stat_category] || CATEGORY_COLORS['discipline'];
                          const done = completedTaskIds.has(task.id);
                          return (
                            <motion.div
                              key={task.id}
                              whileHover={{ x: 3 }}
                              className={`time-block flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${done ? 'opacity-50' : ''} ${colors.bg} ${colors.border}`}
                            >
                              <div className="flex items-center gap-2">
                                {done ? <CheckCircle2 className={`w-3.5 h-3.5 ${colors.text}`} /> : <div className={`w-2 h-2 rounded-full ${colors.bg.replace('/15', '')} border ${colors.border}`} />}
                                <span className={`font-mono text-xs ${done ? 'line-through opacity-60' : 'text-white'}`}>{task.title}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono ${RANK_COLORS[task.difficulty]}`}>{task.difficulty}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`font-mono text-[9px] font-bold ${colors.text}`}>+{task.xp_reward} XP</span>
                                {!done && (
                                  <button
                                    onClick={() => completeTask(task.id, task.xp_reward)}
                                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`}
                                  >
                                    Done
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      )}

      {/* ── ADD TASK MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-panel max-w-md w-full p-6 border-t-2 border-t-cyan-500 shadow-neon-blue relative z-10"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-cyan-400">
                <Calendar className="w-5 h-5" /> Establish Directive
              </h2>
              <form onSubmit={handleSubmitManualTask} className="space-y-5">
                <div>
                  <label className="block font-mono text-xs text-white/70 tracking-widest uppercase mb-2">Objective Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 100 Pushups, Code 2 Hours" className="w-full bg-void border border-white/20 p-3 text-white font-body focus:border-cyan-500 focus:outline-none transition-colors" required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs text-white/70 uppercase mb-2">Time Slot</label>
                    <input type="text" value={newTimeSlot} onChange={e => setNewTimeSlot(e.target.value)} placeholder="e.g. 08:00" className="w-full bg-void border border-white/20 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors" required />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-white/70 uppercase mb-2">Stat Domain</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-void border border-white/20 p-3 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors">
                      {validCategories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-xs text-white/70 uppercase mb-2">Quest Rank</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {(['S','A','B','C','D','E'] as const).map(r => (
                      <button
                        key={r} type="button" onClick={() => setNewDifficulty(r)}
                        className={`py-2 text-xs font-mono font-bold rounded border transition-all ${newDifficulty === r ? RANK_COLORS[r] : 'text-white/30 border-white/10 hover:text-white/60'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 btn-ghost py-3 text-xs">ABORT</button>
                  <button type="submit" className="flex-1 btn-primary py-3 text-xs">ESTABLISH</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TEMPLATE MODAL ── */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTemplateModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel max-w-lg w-full p-6 border-t-2 border-t-accent-purple relative z-10"
            >
              <button onClick={() => setIsTemplateModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-2 text-[#A78BFA]">Seed Templates</h2>
              <p className="font-mono text-[10px] text-white/40 mb-5 uppercase tracking-wider">Load pre-built training protocols into your daily schedule.</p>
              <div className="space-y-3">
                {Object.keys(PRESET_TEMPLATES).map(name => {
                  const pts = PRESET_TEMPLATES[name as keyof typeof PRESET_TEMPLATES];
                  return (
                    <div
                      key={name}
                      onClick={() => handleLoadTemplate(name as any)}
                      className="p-4 rounded-lg bg-black/40 border border-white/5 hover:border-[#A78BFA]/50 cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#A78BFA] transition-all">{name}</h4>
                        <p className="font-mono text-[9px] text-white/30 mt-1">{pts.length} directives • {pts.map(t => t.title).slice(0, 2).join(', ')}...</p>
                      </div>
                      <span className="font-mono text-[10px] text-[#A78BFA] uppercase tracking-wider border border-[#A78BFA]/30 px-2 py-1 rounded">Seed</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
