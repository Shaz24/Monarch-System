import { motion, AnimatePresence } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../hooks/useTasks';
import { useProfile } from '../hooks/useProfile';
import { Loader2, UploadCloud, Plus, Calendar, X, ShieldAlert as ShieldIcon, Filter, Layers } from 'lucide-react';
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

export default function Schedule() {
  const { tasks, completedTaskIds, loading, completeTask, addTask, updateTask, deleteTask } = useTasks();
  const { profile, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Manual Task States
  const [newTimeSlot, setNewTimeSlot] = useState('12:00');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('discipline');
  const [newDifficulty, setNewDifficulty] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('D');

  // Filtering / Sorting
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRank, setFilterRank] = useState<string>('all');

  // Local state for Streak Freeze Shield counts
  const [streakFreezes, setStreakFreezes] = useState<number>(() => {
    return parseInt(localStorage.getItem('monarch_streak_freezes') || '0', 10);
  });

  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    return localStorage.getItem('monarch_shield_active') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('monarch_streak_freezes', streakFreezes.toString());
  }, [streakFreezes]);

  useEffect(() => {
    localStorage.setItem('monarch_shield_active', shieldActive.toString());
  }, [shieldActive]);

  // Helper to auto-rank tasks and assign XP
  const autoRankTask = (title: string) => {
    const t = title.toLowerCase();
    let difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' = 'D';
    let xp = 20;

    if (t.includes('marathon') || t.includes('extreme') || t.includes('boss')) {
      difficulty = 'S'; xp = 100;
    } else if (t.includes('deep') || t.includes('workout') || t.includes('code') || t.includes('build')) {
      difficulty = 'A'; xp = 80;
    } else if (title.length > 30 || t.includes('study') || t.includes('read')) {
      difficulty = 'B'; xp = 60;
    } else if (title.length > 15) {
      difficulty = 'C'; xp = 40;
    } else if (title.length < 5) {
      difficulty = 'E'; xp = 10;
    }

    return { difficulty, xp_reward: xp };
  };

  const validCategories = [
    'strength', 'discipline', 'intelligence', 'creativity', 
    'endurance', 'charisma', 'focus', 'stoicism', 'wealth', 'consistency'
  ];

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
          
          if (!validCategories.includes(stat_category)) {
            stat_category = 'discipline';
          }
          
          const { difficulty, xp_reward } = autoRankTask(title);
          
          await addTask({
            time_slot,
            title,
            stat_category,
            difficulty,
            xp_reward,
            is_recurring: true
          });
          addedCount++;
        }
      }
      toast.success(`${addedCount} directives successfully uploaded and auto-ranked.`, { icon: '📝' });
    } catch (error: any) {
      console.error('CSV parse error:', error);
      toast.error(`Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = () => {
    setNewTitle('');
    setNewTimeSlot('12:00');
    setNewCategory('discipline');
    setNewDifficulty('D');
    setIsAddModalOpen(true);
  };

  const handleSubmitManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const xpMap = { S: 100, A: 80, B: 60, C: 40, D: 20, E: 10 };
    addTask({
      time_slot: newTimeSlot,
      title: newTitle,
      stat_category: newCategory,
      difficulty: newDifficulty,
      xp_reward: xpMap[newDifficulty],
      is_recurring: true
    });
    setIsAddModalOpen(false);
    toast.success('Directive scheduled.');
  };

  // Buy Streak Freeze Shield
  const handleBuyShield = async (currency: 'xp' | 'aura') => {
    if (!profile) return;

    if (currency === 'xp') {
      if (profile.current_xp < 500) {
        toast.error('Insufficient XP (requires 500 XP)');
        return;
      }
      // Deduct XP
      try {
        await updateProfile({ current_xp: profile.current_xp - 500 });
        setStreakFreezes(prev => prev + 1);
        sounds.playFanfare();
        toast.success('Streak Freeze Shield purchased successfully (-500 XP)!');
      } catch (e) {
        toast.error('Failed to process XP transaction');
      }
    } else {
      if ((profile.aura_level ?? 100) < 100) {
        toast.error('Insufficient Aura (requires 100 Aura)');
        return;
      }
      // Deduct Aura
      try {
        await updateProfile({ aura_level: Math.max(0, (profile.aura_level ?? 100) - 100) });
        setStreakFreezes(prev => prev + 1);
        sounds.playFanfare();
        toast.success('Streak Freeze Shield purchased successfully (-100 Aura)!');
      } catch (e) {
        toast.error('Failed to process Aura transaction');
      }
    }
  };

  // Activate Streak Freeze Shield
  const handleToggleShield = () => {
    if (shieldActive) {
      setShieldActive(false);
      toast('Streak Freeze Shield deactivated.', { icon: '🛡️' });
    } else {
      if (streakFreezes <= 0) {
        toast.error('No Streak Freeze Shields available in inventory! Buy one first.');
        return;
      }
      setStreakFreezes(prev => prev - 1);
      setShieldActive(true);
      sounds.playChime();
      toast.success('Shield activated! Your streak is secured for the next missed log.', { icon: '🛡️' });
    }
  };

  // Seed schedule templates
  const handleLoadTemplate = async (templateName: keyof typeof PRESET_TEMPLATES) => {
    const templateTasks = PRESET_TEMPLATES[templateName];
    setIsTemplateModalOpen(false);
    toast.loading(`Seeding ${templateName} template...`, { duration: 1000 });

    for (const t of templateTasks) {
      await addTask({
        time_slot: t.time_slot,
        title: t.title,
        stat_category: t.stat_category,
        difficulty: t.difficulty as any,
        xp_reward: t.xp_reward,
        is_recurring: true
      });
    }
    toast.success(`Successfully seeded ${templateName} Daily Directives!`);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchCat = filterCategory === 'all' || task.stat_category.toLowerCase() === filterCategory.toLowerCase();
      const matchRank = filterRank === 'all' || task.difficulty === filterRank;
      return matchCat && matchRank;
    });
  }, [tasks, filterCategory, filterRank]);

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-[1000px] mx-auto w-full space-y-8">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="space-y-4 mt-8">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1000px] mx-auto w-full space-y-8 relative"
    >
      {/* Background radial highlight */}
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white mb-2">
            Daily <span className="text-cyan-400">Directives</span>
          </h1>
          <p className="font-space-mono text-xs text-white/50 tracking-widest uppercase">
            Failure to complete directives reduces aura. Proceed with discipline.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn-ghost py-2 px-4 flex items-center gap-2 text-xs border border-accent-purple/20 text-[#A78BFA]"
          >
            <Layers className="w-4 h-4" />
            Seed presets
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-ghost py-2 px-4 flex items-center gap-2 text-xs"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload CSV
          </button>
          <button 
            onClick={handleManualAdd}
            className="btn-primary py-2 px-4 flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Establish Quest
          </button>
        </div>
      </div>

      {/* STREAK FREEZE SHIELD WIDGET */}
      <div className="glass-panel p-6 border-l-4 border-[#A78BFA] bg-[#A78BFA]/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-black/40 border transition-all ${
            shieldActive ? 'border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-400' : 'border-white/10 text-white/40'
          }`}>
            <ShieldIcon className={`w-8 h-8 ${shieldActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#F1F5F9] flex items-center gap-2">
              Streak Freeze Shield
              {shieldActive && <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-space-mono font-bold animate-pulse">ACTIVE</span>}
            </h3>
            <p className="font-space-mono text-xs text-white/50 tracking-wide mt-1">
              Protects your streak if you miss your scheduled objectives for up to 24h.
            </p>
            <div className="mt-2 font-space-mono text-[10px] text-[#A78BFA] uppercase tracking-wider">
              Shield Inventory: <span className="font-bold text-white text-xs bg-white/5 px-2 py-0.5 border border-white/10 rounded">{streakFreezes} SHIELDS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleToggleShield}
            className={`px-4 py-2 text-xs font-space-mono font-bold border transition-all ${
              shieldActive
                ? 'bg-red-950/20 border-red-500/30 text-red-400'
                : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            }`}
          >
            {shieldActive ? 'DEACTIVATE SHIELD' : 'ACTIVATE SHIELD'}
          </button>
          
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleBuyShield('xp')}
              className="px-3 py-1.5 rounded bg-black/40 border border-white/10 hover:border-white/20 text-[9px] font-space-mono text-white/70 uppercase tracking-widest transition-all text-center hover:text-white"
            >
              Buy: 500 XP
            </button>
            <button
              onClick={() => handleBuyShield('aura')}
              className="px-3 py-1.5 rounded bg-black/40 border border-white/10 hover:border-white/20 text-[9px] font-space-mono text-[#A78BFA] uppercase tracking-widest transition-all text-center hover:text-white"
            >
              Buy: 100 Aura
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SORT CONTROLS */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 bg-void/50">
        <div className="flex items-center gap-2 text-white/50">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-space-mono text-xs uppercase tracking-widest">Filter Matrix</span>
        </div>

        <div className="flex flex-wrap gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="font-space-mono text-[10px] uppercase text-white/40">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-void border border-white/10 text-white/70 font-space-mono text-xs px-2 py-1 outline-none focus:border-cyan-500/50"
            >
              <option value="all">ALL CATEGORIES</option>
              {validCategories.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-space-mono text-[10px] uppercase text-white/40">Rank:</span>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="bg-void border border-white/10 text-white/70 font-space-mono text-xs px-2 py-1 outline-none focus:border-cyan-500/50"
            >
              <option value="all">ALL RANKS</option>
              <option value="S">S RANK</option>
              <option value="A">A RANK</option>
              <option value="B">B RANK</option>
              <option value="C">C RANK</option>
              <option value="D">D RANK</option>
              <option value="E">E RANK</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUEST DIRECTIVES LIST CONTAINER */}
      <div className="flex flex-col gap-4">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Directives Established"
            description="Your quest log is currently clear. Select a preset template or create a custom training protocol."
          />
        ) : (
          filteredTasks.map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              isCompleted={completedTaskIds.has(task.id)}
              onComplete={() => completeTask(task.id, task.xp_reward)} 
              onUpdate={(updates) => updateTask(task.id, updates)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </div>

      {/* Manual Task Dialog Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-panel max-w-md w-full p-6 border-t-2 border-t-cyan-500 shadow-neon-blue relative z-10"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-cyan-400">
                <Calendar className="w-5 h-5" />
                Add Daily Directive
              </h2>

              <form onSubmit={handleSubmitManualTask} className="space-y-6">
                <div>
                  <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                    Quest Objective (Task Title)
                  </label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 100 Pushups, Code 2 Hours"
                    className="w-full bg-void border border-white/20 p-3 text-white font-body focus:border-cyan-500 focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                      Initiation Time
                    </label>
                    <input 
                      type="text" 
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      placeholder="e.g. 08:00, Morning"
                      className="w-full bg-void border border-white/20 p-3 text-white font-space-mono focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                      Stat Domain
                    </label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-void border border-white/20 p-3 text-white font-space-mono focus:border-cyan-500 focus:outline-none transition-colors"
                    >
                      {validCategories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-space-mono text-xs text-white/70 tracking-widest uppercase mb-2">
                      Quest Rank (Difficulty)
                    </label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as any)}
                      className="w-full bg-void border border-white/20 p-3 text-white font-space-mono focus:border-cyan-500 focus:outline-none transition-colors"
                    >
                      <option value="S">S RANK (Extreme, +100 XP)</option>
                      <option value="A">A RANK (Challenging, +80 XP)</option>
                      <option value="B">B RANK (Moderate, +60 XP)</option>
                      <option value="C">C RANK (Regular, +40 XP)</option>
                      <option value="D">D RANK (Easy, +20 XP)</option>
                      <option value="E">E RANK (Minor, +10 XP)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 btn-ghost py-3 text-xs tracking-widest"
                  >
                    ABORT
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 btn-primary py-3 text-xs tracking-widest"
                  >
                    ESTABLISH
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preset Seeding Templates Dialog */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel max-w-lg w-full p-6 border-t-2 border-t-accent-purple shadow-neon-blue relative z-10"
            >
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-4 text-[#A78BFA]">
                Seed Daily Training Templates
              </h2>
              <p className="font-space-mono text-[11px] text-white/40 mb-6 uppercase tracking-wider leading-relaxed">
                Loading a template will automatically schedule recurring training directives tailored to physical, mental, or intellectual excellence!
              </p>

              <div className="space-y-4">
                {Object.keys(PRESET_TEMPLATES).map((name) => {
                  const tasks = PRESET_TEMPLATES[name as keyof typeof PRESET_TEMPLATES];
                  return (
                    <div
                      key={name}
                      onClick={() => handleLoadTemplate(name as any)}
                      className="p-4 rounded bg-black/40 border border-white/5 hover:border-[#A78BFA]/50 cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#A78BFA] transition-all">
                          {name}
                        </h4>
                        <p className="font-space-mono text-[9px] text-white/40 uppercase mt-1">
                          Includes: {tasks.map(t => t.title).join(', ')}
                        </p>
                      </div>
                      <span className="font-space-mono text-[10px] text-[#A78BFA] uppercase tracking-wider">
                        Seed +{tasks.length} Quests
                      </span>
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
