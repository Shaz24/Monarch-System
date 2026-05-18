import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  const shortcutList = [
    { key: 'D', description: 'Access main dashboard' },
    { key: 'S', description: 'Open daily directives (schedule)' },
    { key: 'F', description: 'Open physical conditioning log (fitness)' },
    { key: 'M', description: 'Open mental / monk mode panel (mind)' },
    { key: 'C', description: 'Open engineering portal (coding)' },
    { key: 'R', description: 'Open broadcast console (creator)' },
    { key: 'B', description: 'Enter active boss battles mode' },
    { key: 'A', description: 'View system analytics & charts' },
    { key: 'P', description: 'View hunter profile window' },
    { key: 'Ctrl+K', description: 'Activate global command palette' },
    { key: '?', description: 'Toggle keyboard shortcuts menu' },
  ];

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

          {/* Modal Container */}
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md bg-void/95 border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.25)] pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-monarch" />
                  <span className="font-display font-bold text-xs tracking-widest uppercase text-white/90">
                    System shortcut nodes
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="font-body text-xs text-white/50 leading-relaxed">
                  Toggle fast page routing nodes or search modules instantly via rapid mechanical keyboard keystrokes.
                </p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                  {shortcutList.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-b-0"
                    >
                      <span className="font-body text-xs text-white/70">{item.description}</span>
                      <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-space-mono text-[10px] text-cyan-400 font-bold uppercase shadow-inner">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-center font-space-mono text-[9px] text-white/40 uppercase tracking-widest">
                Monarch System protocol v1.0
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
