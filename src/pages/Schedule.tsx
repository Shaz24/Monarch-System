import { motion, AnimatePresence } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../hooks/useTasks';
import { Loader2, UploadCloud, Plus, Calendar, X } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';

export default function Schedule() {
  const { tasks, completedTaskIds, loading, completeTask, addTask, updateTask, deleteTask } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('12:00');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('discipline');

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
        // Skip header if exists (checking for 'time' or 'title' keyword)
        if (i === 0 && lines[0].toLowerCase().includes('time')) continue;
        
        // Expected CSV: Time, Title, Category
        // Example: 08:00, Morning Workout, strength
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
    setIsAddModalOpen(true);
  };

  const handleSubmitManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const { difficulty, xp_reward } = autoRankTask(newTitle);
    addTask({
      time_slot: newTimeSlot,
      title: newTitle,
      stat_category: newCategory,
      difficulty,
      xp_reward,
      is_recurring: true
    });
    setIsAddModalOpen(false);
    toast.success('Directive scheduled.');
  };

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
      className="p-6 md:p-12 max-w-[1000px] mx-auto w-full space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white mb-2">
            Daily <span className="text-accent-blue">Directives</span>
          </h1>
          <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase">
            Failure to complete directives reduces aura. Proceed with discipline.
          </p>
        </div>
        
        <div className="flex gap-4">
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
            Add Task
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6 border-l-4 border-accent-purple bg-accent-purple/5">
        <p className="font-space-mono text-xs text-white/70">
          <span className="text-accent-purple font-bold">AUTO-RANK SYSTEM ONLINE:</span> 
          {' '}CSV Uploads must be in format: <code className="bg-void px-2 py-1 rounded">Time, Title, Category</code>. The system will automatically calculate task difficulty (S to E) and assign XP based on directive parameters.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Directives Established"
            description="Your quest log is currently clear. Upload a CSV of recurring habits or click Add Task to program your daily training protocol."
          />
        ) : (
          tasks.map((task) => (
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
              className="glass-panel max-w-md w-full p-6 border-t-2 border-t-accent-blue shadow-neon-blue relative z-10"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-orbitron text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-blue">
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
                    className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
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
                      className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
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
                      className="w-full bg-void border border-white/20 p-3 text-white font-archivo-narrow focus:border-accent-blue focus:outline-none transition-colors"
                    >
                      <option value="discipline">Discipline</option>
                      <option value="strength">Strength</option>
                      <option value="intelligence">Intelligence</option>
                      <option value="creativity">Creativity</option>
                      <option value="endurance">Endurance</option>
                      <option value="charisma">Charisma</option>
                      <option value="focus">Focus</option>
                      <option value="stoicism">Stoicism</option>
                      <option value="wealth">Wealth</option>
                      <option value="consistency">Consistency</option>
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
    </motion.div>
  );
}
