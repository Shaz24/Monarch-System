import { useState, useEffect } from 'react';
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

export const TaskRow = ({ 
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

  const difficultyColors: Record<string, string> = {
    'S': 'text-[#FFD700] border-[#FFD700]',
    'A': 'text-accent-purple border-accent-purple',
    'B': 'text-accent-blue border-accent-blue',
    'C': 'text-[#4ade80] border-[#4ade80]',
    'D': 'text-white border-white',
    'E': 'text-white/50 border-white/50',
  };

  return (
    <motion.div 
      layout
      className={`glass-panel border-l-4 transition-colors duration-300 ${completed ? 'border-l-accent-purple opacity-60' : 'border-l-accent-blue hover:shadow-neon-blue'}`}
    >
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={(e) => { e.stopPropagation(); handleComplete(e); }}
            className="text-accent-blue hover:text-accent-purple transition-colors"
          >
            {completed ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
          </button>
          
          <div className="font-space-mono text-sm tracking-widest text-white/50 w-16">
            {task.time_slot}
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="bg-void border border-white/20 p-1 text-white font-space-mono text-sm w-24"
                />
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="bg-void border border-white/20 p-1 text-white font-archivo-narrow text-lg w-full"
                />
              </div>
            ) : (
              <h3 className={`font-archivo-narrow text-lg ${completed ? 'line-through text-white/50' : 'text-white'}`}>
                {task.title}
              </h3>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-space-mono font-bold border ${difficultyColors[task.difficulty]} rounded-none`}>
              {task.difficulty}
            </span>
            <span className="px-2 py-1 text-xs font-space-mono bg-accent-blue/10 text-accent-blue">
              +{task.xp_reward} XP
            </span>
            {isEditing ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  if (onUpdate) onUpdate({ title: editTitle, time_slot: editTime });
                }}
                className="text-accent-blue hover:text-white px-2 text-xs font-space-mono"
              >
                SAVE
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-white/30 hover:text-white px-2 text-xs font-space-mono"
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
                className="text-red-500/50 hover:text-red-500 px-2 text-xs font-space-mono"
              >
                DEL
              </button>
            )}
          </div>

          <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 bg-void/30 flex flex-col md:flex-row gap-6">
              
              {/* Pomodoro Timer */}
              <div className="flex-1 glass-panel p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-accent-purple" />
                  <span className="font-space-mono text-xs uppercase text-accent-purple tracking-widest">
                    {isBreak ? 'Rest Phase' : 'Focus Phase'}
                  </span>
                </div>
                
                <div className="text-center mb-6">
                  <span className="font-orbitron text-5xl font-bold neon-text-blue tracking-widest">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button onClick={toggleTimer} className="btn-primary py-2 px-4 rounded-none flex items-center gap-2">
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isActive ? 'PAUSE' : 'START'}
                  </button>
                  <button onClick={resetTimer} className="btn-ghost py-2 px-4 rounded-none">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="flex-1 glass-panel p-4 border border-white/5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="w-4 h-4 text-white/50" />
                  <span className="font-space-mono text-xs uppercase text-white/50 tracking-widest">Quest Notes</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-white font-archivo-narrow p-0 text-sm"
                  placeholder="Record tactical data here..."
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="DELETE QUEST DIRECTIVE"
        message={`Are you sure you want to delete "${task.title}"? This directive and its XP value will be permanently removed from your log.`}
        confirmLabel="DELETE DIRECTIVE"
        cancelLabel="ABORT"
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          if (onDelete) onDelete();
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </motion.div>
  );
};
