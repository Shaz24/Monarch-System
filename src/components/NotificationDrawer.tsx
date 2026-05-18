import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, Award, Zap, Shield, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { MonarchNotification } from '../hooks/useNotifications';
import { sounds } from '../lib/sound';
import { useState } from 'react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer = ({ isOpen, onClose }: NotificationDrawerProps) => {
  const { notifications, clearNotifications } = useNotifications();
  const [isMuted, setIsMuted] = useState(sounds.getMuteStatus());

  const handleToggleSound = () => {
    const nextMute = sounds.toggleMute();
    setIsMuted(nextMute);
  };

  const getIcon = (type: MonarchNotification['type']) => {
    switch (type) {
      case 'xp':
        return <Zap className="w-4 h-4 text-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />;
      case 'level':
        return <Award className="w-4 h-4 text-gold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />;
      case 'streak':
        return <Zap className="w-4 h-4 text-[#EF4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />;
      case 'achievement':
        return <Shield className="w-4 h-4 text-monarch drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />;
      default:
        return <Bell className="w-4 h-4 text-white/65" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-void/90 backdrop-blur-2xl border-l border-white/5 shadow-2xl z-[101] p-6 flex flex-col justify-between"
          >
            <div className="flex flex-col flex-1 overflow-hidden space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-monarch" />
                  <span className="font-display font-bold text-sm tracking-wider uppercase text-white/90">
                    System logs
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Sound FX Toggle */}
                  <button
                    onClick={handleToggleSound}
                    className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                    title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan" />}
                  </button>

                  <button
                    onClick={onClose}
                    className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 hide-scrollbar">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.01] flex items-center justify-center text-white/30">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-display text-xs text-white/60 uppercase tracking-widest">
                        Queue cleared
                      </p>
                      <p className="font-body text-[11px] text-white/40 mt-1">
                        All systems operational. No active records.
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      layout
                      key={notif.id}
                      className="glass-card p-3 flex gap-3 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                    >
                      <div className="w-8 h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-display text-[11px] font-semibold text-white/90 uppercase tracking-wider truncate">
                            {notif.title}
                          </p>
                          <span className="font-space-mono text-[9px] text-white/30 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-body text-xs text-white/60 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            {notifications.length > 0 && (
              <div className="border-t border-white/5 pt-4 mt-4">
                <button
                  onClick={clearNotifications}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 font-display text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Flush archive logs
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
