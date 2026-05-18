import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Brain, Terminal, Video, Swords, LineChart, User, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useProfile } from '../hooks/useProfile';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/schedule', icon: Calendar, label: 'Directives' },
  { path: '/fitness', icon: Dumbbell, label: 'Physical' },
  { path: '/mind', icon: Brain, label: 'Mental' },
  { path: '/coding', icon: Terminal, label: 'Engineering' },
  { path: '/creator', icon: Video, label: 'Broadcast' },
  { path: '/boss-mode', icon: Swords, label: 'Boss Mode' },
  { path: '/analytics', icon: LineChart, label: 'Analytics' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gold glow-gold mr-2 flex-shrink-0 animate-pulse">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

export const Navigation = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useUIStore();
  const { profile } = useProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isLightMode = theme === 'light';

  // Get active user data
  const userName = profile?.display_name || profile?.username || 'Shadow Monarch';
  const userLevel = profile?.current_level || 1;
  const userXp = profile?.current_xp || 0;
  const nextLevelXp = userLevel * 100;
  const xpPercent = Math.min(100, Math.max(0, (userXp / nextLevelXp) * 100));

  // Initials for avatar
  const initials = userName
    .split(' ')
    .map((n: string) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar (240px) */}
      <nav 
        className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-abyss/85 backdrop-blur-xl border-r border-white/5 z-50 p-5 justify-between"
        style={{ background: 'rgba(13, 17, 23, 0.8)', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="space-y-8 flex flex-col flex-1 overflow-hidden">
          {/* Logo Section */}
          <div className="flex items-center px-2 py-3">
            <CrownIcon />
            <span className="font-display font-bold text-[13px] tracking-[0.15em] text-[#A78BFA] glow-text uppercase">
              Monarch System
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="block"
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-monarch/15 border-l-2 border-[#7C3AED] text-[#A78BFA]' 
                        : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Icon 
                      className={`w-[18px] h-[18px] mr-3 transition-colors duration-150 ${
                        isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8] group-hover:text-[#F1F5F9]'
                      }`}
                    />
                    <span className="font-body text-xs font-medium tracking-wide">
                      {item.label}
                    </span>
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-2">
            <span className="font-body text-xs text-[#94A3B8]">Aesthetic Node</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              {isLightMode ? (
                <Sun className="w-4 h-4 text-cyan" />
              ) : (
                <Moon className="w-4 h-4 text-[#A78BFA]" />
              )}
            </button>
          </div>

          {/* Player Card */}
          <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center space-y-0 gap-3">
              <div className="w-9 h-9 rounded-full bg-[#4C1D95] border border-[#A78BFA]/50 flex items-center justify-center text-xs font-display font-semibold text-white/90 shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-semibold text-[#F1F5F9] truncate">
                  {userName}
                </p>
                <p className="font-display text-[9px] text-[#A78BFA] tracking-wider font-bold">
                  SHADOW MONARCH
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-display">
                <span className="text-[#94A3B8]">SYSTEM INTEGRITY</span>
                <span className="text-[#F59E0B] font-bold">LVL {userLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FDE68A] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Navigation Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-void/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-5">
        <div className="flex items-center">
          <CrownIcon />
          <span className="font-display font-bold text-[12px] tracking-[0.12em] text-[#A78BFA] glow-text uppercase">
            Monarch System
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white/5 border border-white/10 text-white rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-sm md:hidden"
            />
            <motion.nav
              drag="x"
              dragConstraints={{ left: -256, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -80) {
                  setIsMobileOpen(false);
                }
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-abyss border-r border-white/5 p-5 z-50 flex flex-col justify-between md:hidden cursor-grab active:cursor-grabbing"
            >
              {/* Drag indicator line on the right */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-full bg-white/10" />
              <div className="space-y-6 flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center">
                    <CrownIcon />
                    <span className="font-display font-bold text-[12px] tracking-[0.12em] text-[#A78BFA] glow-text uppercase">
                      Monarch
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className="block"
                      >
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-150 ${
                            isActive 
                              ? 'bg-monarch/15 border-l-2 border-[#7C3AED] text-[#A78BFA]' 
                              : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
                          }`}
                        >
                          <Icon 
                            className={`w-[18px] h-[18px] mr-3 transition-colors duration-150 ${
                              isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'
                            }`}
                          />
                          <span className="font-body text-xs font-medium tracking-wide">
                            {item.label}
                          </span>
                        </motion.div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="font-body text-xs text-[#94A3B8]">Aesthetic Node</span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                  >
                    {isLightMode ? (
                      <Sun className="w-4 h-4 text-cyan" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#A78BFA]" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4C1D95] border border-[#A78BFA]/50 flex items-center justify-center text-xs font-display font-semibold text-white/90">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-semibold text-[#F1F5F9] truncate">
                        {userName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-display">
                      <span className="text-[#94A3B8]">SYSTEM INTEGRITY</span>
                      <span className="text-[#F59E0B] font-bold">LVL {userLevel}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FDE68A] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Adjust mobile page padding to support top fixed navigation header */}
      <div className="h-16 md:hidden" />
    </>
  );
};
