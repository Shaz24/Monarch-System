import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Search, Filter, Pin, Trash2, CheckCircle2, Circle,
  ChevronDown, ChevronUp, ChevronRight, Clock, Tag, Zap,
  Calendar, MoreHorizontal, Archive, Flame, Target, AlertTriangle,
  Inbox, Star, X, Edit3, Check, ArrowUpDown, LayoutGrid, List,
  TrendingUp, Award, Brain, Dumbbell, Briefcase, Lightbulb,
  BookOpen, AlertCircle, GripVertical, Copy, Sparkles, Timer,
  BarChart3, FolderOpen, RefreshCw
} from 'lucide-react';
import { useTodos, type Todo, type TodoPriority, type TodoCategory, type TodoStatus, type SubTask } from '../hooks/useTodos';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string; bg: string; border: string; glow: string }> = {
  critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    glow: 'rgba(239,68,68,0.3)'   },
  high:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', glow: 'rgba(249,115,22,0.3)'  },
  medium:   { label: 'Medium',   color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  glow: 'rgba(245,158,11,0.3)'  },
  low:      { label: 'Low',      color: 'text-slate-400',  bg: 'bg-white/8',       border: 'border-white/10',      glow: 'rgba(100,116,139,0.2)' },
};

const CATEGORY_CONFIG: Record<TodoCategory, { label: string; icon: any; color: string; bg: string }> = {
  personal:  { label: 'Personal',  icon: Star,       color: 'text-violet-400', bg: 'bg-violet-500/15' },
  work:      { label: 'Work',      icon: Briefcase,  color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  fitness:   { label: 'Fitness',   icon: Dumbbell,   color: 'text-red-400',    bg: 'bg-red-500/15'    },
  learning:  { label: 'Learning',  icon: BookOpen,   color: 'text-emerald-400',bg: 'bg-emerald-500/15'},
  project:   { label: 'Project',   icon: FolderOpen, color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
  idea:      { label: 'Idea',      icon: Lightbulb,  color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  urgent:    { label: 'Urgent',    icon: AlertCircle,color: 'text-rose-400',   bg: 'bg-rose-500/15'   },
};

const STATUS_CONFIG: Record<TodoStatus, { label: string; color: string }> = {
  active:      { label: 'Active',      color: 'text-white/60'   },
  'in-progress':{ label: 'In Progress', color: 'text-cyan-400'   },
  done:        { label: 'Done',        color: 'text-emerald-400' },
  archived:    { label: 'Archived',    color: 'text-white/25'    },
};

const XP_BY_PRIORITY: Record<TodoPriority, number> = {
  critical: 120, high: 80, medium: 50, low: 25,
};

function getDueBadge(due: string, status: TodoStatus): { label: string; color: string } | null {
  if (status === 'done' || status === 'archived') return null;
  const dueDate = new Date(due);
  const now = new Date();
  const diff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Overdue', color: 'text-red-400' };
  if (diff === 0) return { label: 'Due today', color: 'text-orange-400' };
  if (diff === 1) return { label: 'Due tomorrow', color: 'text-amber-400' };
  if (diff <= 7) return { label: `${diff}d left`, color: 'text-cyan-400' };
  return null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {priority === 'critical' && <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse inline-block" />}
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TodoCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} border border-white/5`}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-monarch to-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="font-mono text-[9px] text-white/30">{done}/{total}</span>
    </div>
  );
}

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────

interface TodoModalProps {
  initial?: Todo | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

function TodoModal({ initial, onSave, onClose }: TodoModalProps) {
  const [title, setTitle]       = useState(initial?.title       || '');
  const [description, setDesc]  = useState(initial?.description || '');
  const [priority, setPriority] = useState<TodoPriority>(initial?.priority || 'medium');
  const [category, setCategory] = useState<TodoCategory>(initial?.category || 'personal');
  const [dueDate, setDueDate]   = useState(initial?.due_date ? initial.due_date.split('T')[0] : '');
  const [estMins, setEstMins]   = useState(initial?.estimated_minutes?.toString() || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState<string[]>(initial?.tags || []);
  const [subtaskInput, setSubInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>(initial?.subtasks || []);
  const [pinned, setPinned]     = useState(initial?.pinned || false);
  const [accentColor, setAccent] = useState(initial?.color_accent || '');
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'subtasks'>('basic');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const xpReward = XP_BY_PRIORITY[priority];

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleAddSubtask = () => {
    const t = subtaskInput.trim();
    if (t) {
      setSubtasks([...subtasks, { id: `sub_${Date.now()}`, title: t, done: false }]);
      setSubInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimated_minutes: estMins ? parseInt(estMins) : undefined,
      tags,
      subtasks,
      xp_reward: xpReward,
      pinned,
      color_accent: accentColor || undefined,
    });
  };

  const tabs = [
    { key: 'basic', label: 'Basic' },
    { key: 'details', label: 'Details' },
    { key: 'subtasks', label: `Subtasks (${subtasks.length})` },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="glass-3 w-full max-w-lg relative overflow-hidden"
        style={accentColor ? { borderColor: accentColor + '40' } : {}}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: accentColor
            ? `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
            : 'linear-gradient(90deg, transparent, var(--color-monarch-glow), transparent)'
          }}
        />

        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-monarch-glow" />
              <span className="font-display text-sm font-bold uppercase tracking-widest text-white">
                {initial ? 'Edit Task' : 'New Task'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* XP Preview */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px] text-amber-400 font-bold">+{xpReward} XP</span>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                  activeTab === tab.key
                    ? 'bg-monarch/20 border border-monarch/30 text-monarch-glow'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-5 pb-5 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
            {/* BASIC TAB */}
            <AnimatePresence mode="wait">
              {activeTab === 'basic' && (
                <motion.div key="basic" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Task Title *</label>
                    <input
                      ref={titleRef}
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full text-sm font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDesc(e.target.value)}
                      placeholder="Add details, notes, context..."
                      rows={2}
                      className="w-full text-sm resize-none"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Priority</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(PRIORITY_CONFIG) as TodoPriority[]).map(p => {
                        const cfg = PRIORITY_CONFIG[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-all ${
                              priority === p
                                ? `${cfg.color} ${cfg.bg} ${cfg.border} shadow-[0_0_12px_${cfg.glow}]`
                                : 'border-white/10 text-white/30 hover:border-white/20'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(CATEGORY_CONFIG) as TodoCategory[]).map(c => {
                        const cfg = CATEGORY_CONFIG[c];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider border transition-all ${
                              category === c
                                ? `${cfg.color} ${cfg.bg} border-current/30`
                                : 'border-white/8 text-white/30 hover:border-white/20'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                  {/* Due date + estimate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full text-sm" />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Est. Minutes</label>
                      <input type="number" value={estMins} onChange={e => setEstMins(e.target.value)} placeholder="30" min="1" className="w-full text-sm" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        placeholder="Add a tag..."
                        className="flex-1 text-sm"
                      />
                      <button type="button" onClick={handleAddTag} className="px-3 py-2 rounded-xl bg-monarch/20 border border-monarch/30 text-monarch-glow text-xs font-mono hover:bg-monarch/30 transition-colors">
                        Add
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60 text-[10px] font-mono">
                            #{tag}
                            <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-white/30 hover:text-red-400">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Accent color + Pin */}
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Accent Color</label>
                      <input type="color" value={accentColor || '#7C3AED'} onChange={e => setAccent(e.target.value)} className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10 p-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setPinned(!pinned)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-mono ${
                          pinned
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {pinned ? 'Pinned' : 'Pin task'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUBTASKS TAB */}
              {activeTab === 'subtasks' && (
                <motion.div key="subtasks" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subtaskInput}
                      onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                      placeholder="Add a subtask... (Enter)"
                      className="flex-1 text-sm"
                    />
                    <button type="button" onClick={handleAddSubtask} className="px-3 py-2 rounded-xl bg-monarch/20 border border-monarch/30 text-monarch-glow text-xs font-mono hover:bg-monarch/30 transition-colors">
                      Add
                    </button>
                  </div>

                  <AnimatePresence>
                    {subtasks.map((sub, i) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-white/20" />
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.map((s, j) => j === i ? { ...s, done: !s.done } : s))}
                          className="shrink-0"
                        >
                          {sub.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <Circle className="w-4 h-4 text-white/25" />
                          }
                        </button>
                        <span className={`flex-1 text-sm font-body ${sub.done ? 'line-through text-white/30' : 'text-white/70'}`}>
                          {sub.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {subtasks.length === 0 && (
                    <div className="text-center py-6 text-white/25 font-mono text-xs">
                      No subtasks yet. Break it down!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-5 pb-5 pt-3 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-ghost text-sm py-2 px-4">Cancel</button>
            <button type="submit" className="btn-monarch text-sm py-2.5 px-6 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {initial ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Todo Card ─────────────────────────────────────────────────────────────────

interface TodoCardProps {
  todo: Todo;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleSubtask: (subId: string) => void;
  onStatusChange: (status: TodoStatus) => void;
  viewMode: 'list' | 'grid';
}

function TodoCard({ todo, onComplete, onDelete, onEdit, onTogglePin, onToggleSubtask, onStatusChange, viewMode }: TodoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const cfg = PRIORITY_CONFIG[todo.priority];
  const catCfg = CATEGORY_CONFIG[todo.category];
  const CatIcon = catCfg.icon;
  const isDone = todo.status === 'done';
  const dueBadge = todo.due_date ? getDueBadge(todo.due_date, todo.status) : null;
  const subtasksDone = todo.subtasks.filter(s => s.done).length;
  const hasSubtasks = todo.subtasks.length > 0;

  // Show expanded if the card is in grid view and has subtasks or description
  const showExpandable = hasSubtasks || todo.description;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.25 }}
      className={`glass-card relative overflow-hidden group transition-all duration-200 ${
        isDone ? 'opacity-60' : ''
      } ${todo.pinned ? 'ring-1 ring-amber-500/20' : ''}`}
      style={todo.color_accent ? { borderColor: todo.color_accent + '30' } : {}}
    >
      {/* Priority accent bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full rounded-l-md"
        style={{ background: `linear-gradient(180deg, ${todo.color_accent || (
          todo.priority === 'critical' ? '#EF4444' :
          todo.priority === 'high' ? '#F97316' :
          todo.priority === 'medium' ? '#F59E0B' : '#475569'
        )}, transparent)` }}
      />

      <div className="p-4 pl-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={isDone ? undefined : onComplete}
            disabled={isDone}
            className={`shrink-0 mt-0.5 transition-all ${isDone ? 'cursor-default' : 'hover:scale-110'}`}
          >
            {isDone
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : todo.status === 'in-progress'
                ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Circle className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                : <Circle className="w-5 h-5 text-white/20 hover:text-monarch-glow transition-colors" />
            }
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`font-body font-medium text-sm leading-snug ${isDone ? 'line-through text-white/40' : 'text-white/90'}`}>
                {todo.pinned && <Pin className="w-3 h-3 text-amber-400 inline mr-1 mb-0.5" />}
                {todo.title}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {showExpandable && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button onClick={onEdit} className="p-1 rounded-lg hover:bg-white/8 text-white/30 hover:text-cyan-400 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-7 z-30 w-44 glass-2 border border-white/10 rounded-xl p-1 shadow-xl"
                        onMouseLeave={() => setShowMenu(false)}
                      >
                        {(['active', 'in-progress', 'done'] as TodoStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => { onStatusChange(s); setShowMenu(false); }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono hover:bg-white/8 transition-colors ${
                              todo.status === s ? 'text-monarch-glow' : 'text-white/50'
                            }`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        <div className="my-1 border-t border-white/8" />
                        <button onClick={() => { onTogglePin(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400 transition-colors flex items-center gap-2">
                          <Pin className="w-3 h-3" /> {todo.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <PriorityBadge priority={todo.priority} />
              <CategoryBadge category={todo.category} />
              {dueBadge && (
                <span className={`text-[9px] font-mono font-bold ${dueBadge.color} flex items-center gap-1`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {dueBadge.label}
                </span>
              )}
              {todo.estimated_minutes && (
                <span className="text-[9px] font-mono text-white/30 flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  {formatTime(todo.estimated_minutes)}
                </span>
              )}
              <span className="text-[9px] font-mono text-amber-400/60 flex items-center gap-0.5 ml-auto">
                <Zap className="w-2.5 h-2.5" />+{todo.xp_reward}
              </span>
            </div>

            {/* Tags */}
            {todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {todo.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Subtask progress bar */}
            {hasSubtasks && !expanded && (
              <div className="mt-2">
                <ProgressBar done={subtasksDone} total={todo.subtasks.length} />
              </div>
            )}
          </div>
        </div>

        {/* Expandable section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pl-8 space-y-3">
                {todo.description && (
                  <p className="text-xs text-white/50 font-body leading-relaxed border-l border-white/10 pl-3">
                    {todo.description}
                  </p>
                )}
                {hasSubtasks && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Subtasks</span>
                      <ProgressBar done={subtasksDone} total={todo.subtasks.length} />
                    </div>
                    {todo.subtasks.map(sub => (
                      <motion.button
                        key={sub.id}
                        onClick={() => onToggleSubtask(sub.id)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left group/sub"
                      >
                        {sub.done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          : <Circle className="w-3.5 h-3.5 text-white/20 group-hover/sub:text-white/40 shrink-0 transition-colors" />
                        }
                        <span className={`text-xs font-body ${sub.done ? 'line-through text-white/25' : 'text-white/60'}`}>
                          {sub.title}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: ReturnType<typeof useTodos>['stats'] }) {
  const items = [
    { label: 'Total',       value: stats.total,      icon: Inbox,        color: 'text-white/60' },
    { label: 'Active',      value: stats.active,     icon: Circle,       color: 'text-white/70' },
    { label: 'In Progress', value: stats.inProgress, icon: RefreshCw,    color: 'text-cyan-400' },
    { label: 'Completed',   value: stats.done,       icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Overdue',     value: stats.overdue,    icon: AlertTriangle,color: stats.overdue > 0 ? 'text-red-400' : 'text-white/25' },
    { label: "Today's XP",  value: stats.todayXp,    icon: Zap,          color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="glass-card p-3 flex flex-col items-center gap-1 relative overflow-hidden">
            <Icon className={`w-4 h-4 ${item.color}`} />
            <span className={`font-display text-lg font-black ${item.color}`}>{item.value}</span>
            <span className="font-mono text-[8px] text-white/25 uppercase tracking-widest">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = 'priority' | 'due_date' | 'created_at' | 'xp_reward' | 'title';
type FilterStatus = 'all' | TodoStatus;

const PRIORITY_ORDER: Record<TodoPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function TodoPage() {
  const {
    todos, stats,
    addTodo, updateTodo, completeTodo, deleteTodo,
    togglePin, toggleSubtask, archiveDone, clearArchived,
  } = useTodos();

  const [searchQuery, setSearchQuery]         = useState('');
  const [filterStatus, setFilterStatus]       = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory]   = useState<TodoCategory | 'all'>('all');
  const [filterPriority, setFilterPriority]   = useState<TodoPriority | 'all'>('all');
  const [sortKey, setSortKey]                 = useState<SortKey>('priority');
  const [sortDir, setSortDir]                 = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode]               = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingTodo, setEditingTodo]         = useState<Todo | null>(null);
  const [showFilters, setShowFilters]         = useState(false);
  const [quickInput, setQuickInput]           = useState('');
  const [showArchived, setShowArchived]       = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setIsModalOpen(true); }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setIsModalOpen(false); setEditingTodo(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Filtered & sorted todos
  const processedTodos = useMemo(() => {
    let filtered = todos.filter(t => {
      if (!showArchived && t.status === 'archived') return false;
      if (showArchived && t.status !== 'archived') return false;

      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          t.tags.some(tag => tag.includes(q)) ||
          t.category.includes(q)
        );
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      // Pinned items always first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      let cmp = 0;
      switch (sortKey) {
        case 'priority': cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
        case 'due_date': {
          const aD = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bD = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          cmp = aD - bD;
          break;
        }
        case 'xp_reward': cmp = b.xp_reward - a.xp_reward; break;
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'created_at': cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [todos, filterStatus, filterCategory, filterPriority, searchQuery, sortKey, sortDir, showArchived]);

  const handleSaveTodo = useCallback((data: any) => {
    if (editingTodo) {
      updateTodo(editingTodo.id, data);
      toast.success('Task updated!');
    } else {
      addTodo(data);
    }
    setIsModalOpen(false);
    setEditingTodo(null);
  }, [editingTodo, updateTodo, addTodo]);

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  // Quick add via Enter
  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickInput.trim()) {
      addTodo({ title: quickInput.trim(), priority: 'medium', category: 'personal', xp_reward: 50, pinned: false });
      setQuickInput('');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterCategory !== 'all',
    filterPriority !== 'all',
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-[1200px] mx-auto w-full space-y-6"
    >
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-monarch/4 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-1/5 w-[250px] h-[250px] bg-cyan-500/3 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* ── Page Header ── */}
      <div className="glass-3 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute inset-0 scanline-overlay opacity-10" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-[10px] text-emerald-400/70 uppercase tracking-[0.25em] font-bold">Task Commander</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black uppercase tracking-wider text-white glow-text">
              Quest Board
            </h1>
            <p className="font-mono text-xs text-white/35 mt-1 uppercase tracking-wider">
              {stats.active + stats.inProgress} active • {stats.done} completed • {stats.todayXp} XP earned today
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.done > 0 && (
              <button
                onClick={archiveDone}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8 transition-all text-xs font-mono"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Done ({stats.done})
              </button>
            )}
            <button
              onClick={() => { setEditingTodo(null); setIsModalOpen(true); }}
              className="btn-monarch flex items-center gap-2 py-2.5 px-5 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Task
              <kbd className="font-mono text-[9px] bg-black/20 px-1.5 py-0.5 rounded-md border border-white/10">N</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── Quick-add bar ── */}
      <div className="glass-card flex items-center gap-3 p-3 px-4">
        <Plus className="w-4 h-4 text-white/30 shrink-0" />
        <input
          type="text"
          value={quickInput}
          onChange={e => setQuickInput(e.target.value)}
          onKeyDown={handleQuickAdd}
          placeholder="Quick add... press Enter to create with defaults  (or press N for full form)"
          className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 placeholder:text-white/20 font-body"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, borderRadius: 0 }}
        />
        {quickInput && (
          <span className="font-mono text-[9px] text-white/25">↵ Enter</span>
        )}
      </div>

      {/* ── Search & Filter ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks...  (/)"
              className="w-full pl-9 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-monarch/15 border-monarch/30 text-monarch-glow'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-monarch text-white text-[8px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 text-xs font-mono transition-all">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort: {sortKey}
            </button>
            <div className="absolute right-0 top-10 z-20 w-40 glass-2 border border-white/10 rounded-xl p-1 shadow-xl hidden group-hover:block">
              {(['priority', 'due_date', 'xp_reward', 'created_at', 'title'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono hover:bg-white/8 flex items-center justify-between transition-colors ${
                    sortKey === key ? 'text-monarch-glow' : 'text-white/50'
                  }`}
                >
                  {key.replace('_', ' ')}
                  {sortKey === key && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* View mode */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-monarch/20 text-monarch-glow' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-monarch/20 text-monarch-glow' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-mono transition-all ${
              showArchived ? 'bg-white/8 border-white/20 text-white/70' : 'bg-white/3 border-white/8 text-white/30'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            {stats.archived}
          </button>
        </div>

        {/* Filter panels */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-4 space-y-3">
                {/* Status filter */}
                <div>
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'active', 'in-progress', 'done'] as (FilterStatus)[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-mono border transition-all ${
                          filterStatus === s ? 'bg-monarch/20 border-monarch/30 text-monarch-glow' : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority filter */}
                <div>
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-2">Priority</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', ...Object.keys(PRIORITY_CONFIG)] as ('all' | TodoPriority)[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-mono border transition-all ${
                          filterPriority === p
                            ? p === 'all' ? 'bg-monarch/20 border-monarch/30 text-monarch-glow' : `${PRIORITY_CONFIG[p as TodoPriority].bg} ${PRIORITY_CONFIG[p as TodoPriority].border} ${PRIORITY_CONFIG[p as TodoPriority].color}`
                            : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {p === 'all' ? 'All' : PRIORITY_CONFIG[p as TodoPriority].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', ...Object.keys(CATEGORY_CONFIG)] as ('all' | TodoCategory)[]).map(c => {
                      if (c === 'all') return (
                        <button key="all" onClick={() => setFilterCategory('all')} className={`px-3 py-1 rounded-xl text-[10px] font-mono border transition-all ${filterCategory === 'all' ? 'bg-monarch/20 border-monarch/30 text-monarch-glow' : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'}`}>
                          All
                        </button>
                      );
                      const cfg = CATEGORY_CONFIG[c as TodoCategory];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={c}
                          onClick={() => setFilterCategory(c as TodoCategory)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-mono border transition-all ${
                            filterCategory === c ? `${cfg.bg} border-current/30 ${cfg.color}` : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-2.5 h-2.5" />{cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); }}
                    className="text-[10px] font-mono text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Todo List / Grid ── */}
      <AnimatePresence mode="popLayout">
        {processedTodos.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7 text-white/20" />
            </div>
            <p className="font-display text-sm text-white/30 uppercase tracking-widest">
              {searchQuery || activeFiltersCount > 0 ? 'No tasks match your filters' : showArchived ? 'No archived tasks' : 'Quest board is clear'}
            </p>
            {!searchQuery && activeFiltersCount === 0 && !showArchived && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-monarch py-2.5 px-6 text-sm mx-auto flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create your first task
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
              : 'flex flex-col gap-2'
            }
          >
            <AnimatePresence mode="popLayout">
              {processedTodos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  viewMode={viewMode}
                  onComplete={() => completeTodo(todo.id)}
                  onDelete={() => deleteTodo(todo.id)}
                  onEdit={() => handleEdit(todo)}
                  onTogglePin={() => togglePin(todo.id)}
                  onToggleSubtask={(subId) => toggleSubtask(todo.id, subId)}
                  onStatusChange={(status) => updateTodo(todo.id, { status })}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result count ── */}
      {processedTodos.length > 0 && (
        <p className="text-center font-mono text-[9px] text-white/20 uppercase tracking-widest">
          {processedTodos.length} task{processedTodos.length !== 1 ? 's' : ''} shown
          {activeFiltersCount > 0 || searchQuery ? ` · ${todos.length} total` : ''}
        </p>
      )}

      {/* ── Archive controls ── */}
      {showArchived && stats.archived > 0 && (
        <div className="flex justify-center">
          <button
            onClick={clearArchived}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all archived tasks
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <TodoModal
            initial={editingTodo}
            onSave={handleSaveTodo}
            onClose={() => { setIsModalOpen(false); setEditingTodo(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
