import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Terminal, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { tasks, completeTask, completedTaskIds } = useTasks();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pages options
  const pages = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard', type: 'page', icon: Compass, xp: 0 },
    { id: 'schedule', name: 'Directives (Schedule)', path: '/schedule', type: 'page', icon: FileText, xp: 0 },
    { id: 'fitness', name: 'Physical (Fitness)', path: '/fitness', type: 'page', icon: Compass, xp: 0 },
    { id: 'mind', name: 'Mental (Mind)', path: '/mind', type: 'page', icon: Compass, xp: 0 },
    { id: 'coding', name: 'Engineering (Coding)', path: '/coding', type: 'page', icon: Terminal, xp: 0 },
    { id: 'creator', name: 'Broadcast (Creator)', path: '/creator', type: 'page', icon: Compass, xp: 0 },
    { id: 'boss-mode', name: 'Boss Mode', path: '/boss-mode', type: 'page', icon: Compass, xp: 0 },
    { id: 'analytics', name: 'Analytics', path: '/analytics', type: 'page', icon: Compass, xp: 0 },
    { id: 'profile', name: 'Profile', path: '/profile', type: 'page', icon: Compass, xp: 0 },
    { id: 'edit-profile', name: 'Edit Profile', path: '/edit-profile', type: 'page', icon: Compass, xp: 0 },
  ];

  // Map tasks to queryable options
  const taskOptions = tasks
    .filter(t => !completedTaskIds.has(t.id))
    .map(t => ({
      id: t.id,
      name: t.title,
      xp: t.xp_reward,
      type: 'task',
      icon: CheckCircle2,
      path: ''
    }));

  const allItems = [...pages, ...taskOptions];

  // Filter items
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = filteredItems[selectedIndex];
        if (activeItem) {
          handleSelect(activeItem);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleSelect = (item: any) => {
    if (item.type === 'page') {
      navigate(item.path);
      onClose();
    } else if (item.type === 'task') {
      completeTask(item.id, item.xp);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[150]"
          />

          {/* Palette Container */}
          <div className="fixed inset-0 z-[151] flex items-start justify-center pt-[6vh] sm:pt-[15vh] px-3 sm:px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-xl bg-void/95 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.25)] pointer-events-auto max-h-[80vh] flex flex-col"
            >
              {/* Search bar */}
              <div className="flex items-center px-4 border-b border-white/5 bg-white/[0.01]">
                <Search className="w-5 h-5 text-white/40 mr-3 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search directives, pages, or commands..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full py-3.5 sm:py-4 bg-transparent border-0 text-sm text-white placeholder-white/30 focus:ring-0 outline-none font-body"
                />
              </div>

              {/* Suggestions */}
              <div className="max-h-[360px] overflow-y-auto p-2 hide-scrollbar">
                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-white/40 text-xs font-display uppercase tracking-widest">
                    No results found
                  </div>
                ) : (
                  filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    
                    return (
                      <div
                        key={item.id || item.name}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-monarch/20 border border-monarch/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                            : 'border border-transparent text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-monarch' : 'text-white/40'}`} />
                          <span className="font-body text-xs font-medium truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-space-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.type === 'page'
                              ? 'bg-white/5 border border-white/10 text-white/50'
                              : 'bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 font-bold'
                          }`}>
                            {item.type === 'page' ? 'Page' : `+${item.xp} XP`}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between font-space-mono text-[9px] text-white/40">
                <div className="flex gap-4">
                  <span><span className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-white/60">↑↓</span> navigate</span>
                  <span><span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">enter</span> execute</span>
                </div>
                <span><span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">esc</span> dismiss</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
