import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, ChevronDown, Clock, Play, Pause, RotateCcw, PenTool } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface Task {
  id: string;
  time_slot: string;
  title: string;
  xp_reward: number;
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  stat_category: string;
}

export const TaskRow = memo(({ 
  task, 
  isCompleted = false,
  onComplete,
  onUpdate,
  onDelete
}: { 
  task: Task; 
  isCompleted?: boolean;
  onComplete?: () => void;
  onUpdate?: (updates: Partial<Task>) => void;
  onDelete?: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editTime, setEditTime] = useState(task.time_slot);
  const [localCompleted, setLocalCompleted] = useState(false);
  const completed = isCompleted || localCompleted;
  const [expanded, setExpanded] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { addXpParticle, triggerLevelUp } = useUIStore();
  
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound
      try {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
      } catch (e) {}
      
      if (!isBreak) {
        toast.success('Focus session complete! Take a 5 min break.');
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        toast('Break over. Ready to focus?', { icon: '⚡' });
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const handleComplete = (e: React.MouseEvent) => {
    if (completed) return;
    setLocalCompleted(true);
    addXpParticle(e.clientX, e.clientY, task.xp_reward);
    
    // Call the external onComplete handler to update database
    if (onComplete) onComplete();
    
    // Simulate a random level up for demo purposes (10% chance)
    if (Math.random() > 0.9) {
      setTimeout(() => triggerLevelUp(), 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const difficultyColors: Record<string, { badge: string; glow: string }> = {
    'S': { badge: 'text-[#F59E0B] bg-amber-500/10 border-amber-500/30', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
    'A': { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30', glow: 'shadow-[0_0_10px_rgba(167,139,250,0.3)]' },
    'B': { badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]' },
    'C': { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
    'D': { badge: 'text-white/60 bg-white/5 border-white/10', glow: '' },
    'E': { badge: 'text-white/40 bg-white/[0.02] border-white/5', glow: '' },
  };

  const diffCfg = difficultyColors[task.difficulty] || difficultyColors['D'];

  return (
    <motion.div 
      layout
      className={`glass-2 border transition-all duration-300 rounded-xl overflow-hidden ${
        completed 
          ? 'border-emerald-500/20 bg-emerald-500/[0.03] opacity-70' 
          : 'border-white/[0.08] hover:border-monarch-glow/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="p-4 flex items-center justify-between cursor-pointer group" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button 
            onClick={(e) => { e.stopPropagation(); handleComplete(e); }}
            className="text-cyan-400 hover:text-emerald-400 transition-colors p-1 cursor-pointer flex-shrink-0"
          >
            {completed 
              ? <CheckSquare className="w-5 h-5 text-emerald-400 filter drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> 
              : <Square className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
            }
          </button>
          
          <div className="font-mono text-xs font-bold tracking-wider text-cyan-400/90 bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded-lg flex-shrink-0 shadow-inner">
            {task.time_slot}
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="bg-black/50 border border-white/20 p-1.5 rounded-lg text-white font-mono text-xs w-24"
                />
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-black/50 border border-white/20 p-1.5 rounded-lg text-white font-display text-sm w-full"
                />
              </div>
            ) : (
              <h3 className={`font-display text-sm md:text-base font-semibold truncate transition-colors ${completed ? 'line-through text-white/40' : 'text-white/90 group-hover:text-white'}`}>
                {task.title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-black border rounded-md uppercase tracking-wider ${diffCfg.badge} ${diffCfg.glow}`}>
              {task.difficulty}
            </span>
            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md">
              +{task.xp_reward} XP
            </span>
            {isEditing ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  if (onUpdate) onUpdate({ title: editTitle, time_slot: editTime });
                }}
                className="btn-success py-1 px-3 text-[10px] rounded-lg cursor-pointer"
              >
                SAVE
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="hidden sm:inline-block text-white/30 hover:text-white px-2 py-1 text-xs font-mono rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                EDIT
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteConfirmOpen(true);
                }}
                className="hidden sm:inline-block text-red-400/40 hover:text-red-400 px-2 py-1 text-xs font-mono rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                DEL
              </button>
            )}
          </div>

          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${expanded ? 'rotate-180 text-white' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/[0.06] bg-black/20"
          >
            <div className="p-3.5 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5">
              
              {/* Mobile Quick Action Buttons (when collapsed header hid them) */}
              <div className="flex sm:hidden items-center justify-between gap-2 pt-1 pb-2 border-b border-white/5">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-mono active:scale-95"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Directive'}
                </button>
                {onDelete && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Pomodoro Timer */}
              <div className="flex-1 glass-3 p-4 sm:p-5 rounded-xl border border-white/[0.08] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Clock className="w-4 h-4 text-monarch-glow" />
                  <span className="font-mono text-xs uppercase text-monarch-glow tracking-widest font-bold">
                    {isBreak ? 'Rest Cycle' : 'Deep Focus Interval'}
                  </span>
                </div>
                
                <div className="text-center my-3 sm:my-4">
                  <span className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 glow-text tracking-wider tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                <div className="flex justify-center gap-2.5 sm:gap-3">
                  <button onClick={toggleTimer} className="btn-monarch py-2 px-4 sm:px-5 text-xs rounded-xl flex items-center gap-2">
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isActive ? 'PAUSE' : 'START FOCUS'}
                  </button>
                  <button onClick={resetTimer} className="btn-ghost py-2 px-3.5 sm:px-4 text-xs rounded-xl">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="flex-1 glass-3 p-4 sm:p-5 rounded-xl border border-white/[0.08] flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="w-4 h-4 text-white/40" />
                  <span className="font-mono text-xs uppercase text-white/50 tracking-widest font-bold">Tactical Notes</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full flex-1 bg-black/30 border border-white/5 rounded-lg p-3 resize-none focus:outline-none focus:border-monarch-glow/40 text-white font-mono text-xs placeholder:text-white/20 min-h-[80px]"
                  placeholder="Record objective data, roadblocks, or notes..."
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="DELETE DIRECTIVE"
        message={`Are you sure you want to delete "${task.title}"? This directive will be permanently removed.`}
        confirmLabel="CONFIRM DELETE"
        cancelLabel="ABORT"
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          if (onDelete) onDelete();
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </motion.div>
  );
});

TaskRow.displayName = 'TaskRow';
