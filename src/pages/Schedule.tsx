import { motion } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../hooks/useTasks';
import { Loader2, UploadCloud, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function Schedule() {
  const { tasks, completedTaskIds, loading, completeTask, addTask, updateTask, deleteTask } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    const time_slot = prompt('Enter time slot (e.g. 08:00):', '12:00');
    if (!time_slot) return;
    const title = prompt('Enter task title:', 'New Directive');
    if (!title) return;
    const stat_category = prompt('Enter stat category (strength, focus, intelligence, discipline, etc):', 'discipline') || 'discipline';
    
    const { difficulty, xp_reward } = autoRankTask(title);
    addTask({ time_slot, title, stat_category, difficulty, xp_reward, is_recurring: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
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
          <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
            No directives established.
          </div>
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
    </motion.div>
  );
}
