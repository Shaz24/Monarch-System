import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../lib/sound';

export const SystemBootFlash = () => {
  const [stage, setStage] = useState<'loading' | 'completed' | 'none'>('none');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Only show system boot once per session
    const hasBooted = sessionStorage.getItem('monarch_system_booted') === 'true';
    if (hasBooted) {
      setStage('none');
      return;
    }

    setStage('loading');
    sessionStorage.setItem('monarch_system_booted', 'true');
    sounds.playSystemBoot();

    const bootLogs = [
      'INITIALIZING SYSTEM DEPLOYMENT...',
      'CONNECTING TO CORE PROTOCOL NODES...',
      'ESTABLISHING DATABASE SYNC...',
      'VERIFYING LEVEL INTEGRITY DATA...',
      'DOWNLOADING HUNTER PROFILE SCHEMATIC...',
      'PROTOCOL V1.0 ONLINE.',
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        setLogs((prev) => [...prev, bootLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStage('completed');
        }, 300);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (stage === 'none') return null;

  return (
    <AnimatePresence>
      {stage === 'loading' && (
        <motion.div
          key="loading"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-[#080B12] z-[999] flex flex-col justify-center p-8 sm:p-12 font-space-mono text-cyan-400 select-none pointer-events-auto"
        >
          <div className="max-w-xl mx-auto w-full space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-white/90">
                SYSTEM RE-BOOT IN PROGRESS
              </h1>
            </div>
            
            <div className="border border-white/5 bg-black/40 rounded-xl p-6 min-h-[220px] font-space-mono text-[11px] text-cyan-400/80 space-y-2 overflow-hidden shadow-inner leading-relaxed">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-white/20 select-none">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {logs.length < 6 && (
                <div className="flex gap-2">
                  <span className="text-white/20 select-none">&gt;&gt;</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest pt-2">
              <span>Node: localhost:5174</span>
              <span>Sub: Secure auth link</span>
            </div>
          </div>
        </motion.div>
      )}

      {stage === 'completed' && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ times: [0, 0.1, 0.4, 1], duration: 0.8 }}
          onAnimationComplete={() => setStage('none')}
          className="fixed inset-0 bg-white z-[1000] pointer-events-none mix-blend-screen"
        />
      )}
    </AnimatePresence>
  );
};
