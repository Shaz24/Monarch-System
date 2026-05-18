import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col gap-4 z-10"
            style={{
              background: 'rgba(8, 13, 26, 0.95)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-orbitron font-bold text-lg text-white">{title}</h3>
            </div>

            <p className="font-space-mono text-xs text-white/60 leading-relaxed">
              {message}
            </p>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-space-mono text-xs uppercase tracking-wider transition-colors duration-200"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-space-mono text-xs uppercase tracking-wider transition-colors duration-200"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
