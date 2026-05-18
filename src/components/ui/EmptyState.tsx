import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center text-center p-8 border border-white/5 bg-panel/30 backdrop-blur-md rounded-2xl max-w-md mx-auto my-6"
    >
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#00d4ff] mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-orbitron font-bold text-lg text-white mb-2">{title}</h3>
      <p className="font-space-mono text-xs text-white/50 mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary flex items-center justify-center gap-2 py-2 px-6"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
