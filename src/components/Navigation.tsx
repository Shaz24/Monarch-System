import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Brain, Terminal, Video, Swords, LineChart, User, Sun, Moon, Menu, X, Flame, Clock, ChevronLeft, ChevronRight, Atom, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useProfile } from '../hooks/useProfile';
import { useState, useEffect } from 'react';

interface NavItem {
  path: string;
  icon: any;
  label: string;
  color: string;
  glow: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Core',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#A78BFA', glow: 'rgba(124,58,237,0.25)' },
      { path: '/schedule', icon: Calendar, label: 'Directives', color: '#818CF8', glow: 'rgba(129,140,248,0.25)' },
      { path: '/todo', icon: CheckSquare, label: 'Quest Board', color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
    ],
  },
  {
    title: 'Training',
    items: [
      { path: '/fitness', icon: Dumbbell, label: 'Physical', color: '#EF4444', glow: 'rgba(239,68,68,0.25)' },
      { path: '/mind', icon: Brain, label: 'Mental', color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
      { path: '/coding', icon: Terminal, label: 'Engineering', color: '#06B6D4', glow: 'rgba(6,182,212,0.25)' },
      { path: '/creator', icon: Video, label: 'Broadcast', color: '#F97316', glow: 'rgba(249,115,22,0.25)' },
    ],
  },
  {
    title: 'Combat',
    items: [
      { path: '/boss-mode', icon: Swords, label: 'Boss Mode', color: '#DC2626', glow: 'rgba(220,38,38,0.25)' },
    ],
  },
  {
    title: 'Intel',
    items: [
      { path: '/analytics', icon: LineChart, label: 'Analytics', color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
      { path: '/antigravity', icon: Atom, label: 'Antigravity', color: '#9b5de5', glow: 'rgba(155,93,229,0.30)' },
      { path: '/profile', icon: User, label: 'Profile', color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
    ],
  },
];

const SECTION_COLORS: Record<string, string> = {
  Core: '#A78BFA',
  Training: '#06B6D4',
  Combat: '#DC2626',
  Intel: '#F59E0B',
};

const CrownIcon = () => (
  <div className="relative flex items-center justify-center mr-2 flex-shrink-0 group">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#crownGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform duration-300">
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M3 20h18" />
    </svg>
    <div className="absolute -inset-1 rounded-full bg-amber-500/10 blur-sm pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
  </div>
);

const AvatarRing = ({ percent, initials, avatarUrl }: { percent: number; initials: string; avatarUrl?: string }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r={r} fill="none"
          stroke="url(#xpRingGrad)" strokeWidth="3"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          strokeLinecap="round"
          className="filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
        />
        <defs>
          <linearGradient id="xpRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-1.5 rounded-full bg-monarch-dim border border-monarch-glow/40 shadow-[inset_0_0_10px_rgba(124,58,237,0.3)] flex items-center justify-center overflow-hidden">
        {avatarUrl
          ? <img src={avatarUrl} alt="av" className="w-full h-full object-cover" />
          : <span className="text-[10px] font-display font-bold text-white/90">{initials}</span>
        }
      </div>
    </div>
  );
};

interface NavItemProps {
  item: NavItem;
  onClick?: () => void;
  collapsed?: boolean;
}

const NavItemComponent = ({ item, onClick, collapsed = false }: NavItemProps) => {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname === item.path;

  return (
    <NavLink to={item.path} className="block relative group/nav" onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl transition-all duration-200 cursor-pointer relative ${
          isActive ? 'text-white' : 'text-[#94A3B8] hover:bg-white/[0.05] hover:text-[#F1F5F9]'
        }`}
        style={isActive ? {
          background: `linear-gradient(90deg, ${item.color}22, rgba(255,255,255,0.02))`,
          boxShadow: `inset 0 0 20px ${item.glow}`,
          border: `1px solid ${item.color}30`,
        } : {
          border: '1px solid transparent',
        }}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] rounded-full"
            style={{
              background: `linear-gradient(180deg, ${item.color}, ${item.color}80)`,
              height: '65%',
              boxShadow: `0 0 8px ${item.color}`,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <Icon
          className={`${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px] mr-3'} flex-shrink-0 transition-all duration-200`}
          style={isActive ? { color: item.color } : {}}
        />
        {!collapsed && (
          <>
            <span className={`font-body text-xs font-medium tracking-wide transition-colors ${isActive ? 'text-white font-semibold' : 'text-[#94A3B8] group-hover/nav:text-[#F1F5F9]'}`}>
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-active-dot"
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
              />
            )}
          </>
        )}
        {collapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-void/95 border border-white/10 rounded-lg shadow-xl text-xs font-mono text-white opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        )}
      </motion.div>
    </NavLink>
  );
};

interface PlayerCardProps {
  compact?: boolean;
  xpPercent: number;
  initials: string;
  avatarUrl?: string;
  userName: string;
  userLevel: number;
  userXp: number;
  nextLevelXp: number;
  streakDays: number;
}

const PlayerCard = ({ compact = false, xpPercent, initials, avatarUrl, userName, userLevel, userXp, nextLevelXp, streakDays }: PlayerCardProps) => (
  <div className={`flex flex-col ${compact ? 'items-center' : ''} rounded-xl p-3 space-y-2.5 transition-all duration-300 hover:border-monarch-glow/30`} style={{ background: 'var(--playercard-bg)', border: '1px solid var(--playercard-border)' }}>
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <AvatarRing percent={xpPercent} initials={initials} avatarUrl={avatarUrl} />
      {!compact && (
        <div className="flex-1 min-w-0">
          <p className="font-body text-xs font-semibold text-[#F1F5F9] truncate">{userName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-display text-[9px] text-[#F59E0B] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">LVL {userLevel}</span>
            {streakDays > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                <Flame className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> {streakDays}d
              </span>
            )}
          </div>
        </div>
      )}
    </div>
    {!compact && (
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase">
          <span>XP PROGRESS</span>
          <span className="text-amber-400 font-bold">{userXp} / {nextLevelXp}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-gradient-to-r from-[#F59E0B] via-[#EC4899] to-[#A78BFA] shadow-[0_0_10px_rgba(245,158,11,0.5)] rounded-full"
          />
        </div>
      </div>
    )}
  </div>
);

export const Navigation = () => {
  const { theme, toggleTheme, isSidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore();
  const { profile } = useProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const isLightMode = theme === 'light';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const userName = profile?.display_name || profile?.username || 'Shadow Monarch';
  const userLevel = profile?.current_level || 1;
  const userXp = profile?.current_xp || 0;
  const nextLevelXp = userLevel * 100;
  const xpPercent = Math.min(100, Math.max(0, (userXp / nextLevelXp) * 100));
  const streakDays = profile?.streak_days || 0;
  const initials = userName.split(' ').map((n: string) => n[0] || '').join('').slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || undefined;
  const handleNavClick = () => setIsMobileOpen(false);
  const clockStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const playerCardProps: PlayerCardProps = {
    xpPercent,
    initials,
    avatarUrl,
    userName,
    userLevel,
    userXp,
    nextLevelXp,
    streakDays,
  };

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-60';

  return (
    <>
      <nav
        className={`hidden md:flex flex-col ${sidebarWidth} h-screen fixed left-0 top-0 z-50 ${isCollapsed ? 'p-3' : 'p-5'} justify-between transition-all duration-300`}
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: 'var(--sidebar-shadow)',
        }}
      >
        <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2'} py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04]`}>
            <CrownIcon />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-display font-black text-[13px] tracking-[0.18em] text-[#A78BFA] glow-text uppercase leading-none">
                  Monarch
                </span>
                <span className="font-mono text-[7px] text-white/30 tracking-[0.25em] uppercase mt-0.5">
                  Protocol V2.0
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 hide-scrollbar">
            {NAV_SECTIONS.map((section) => {
              const accentColor = SECTION_COLORS[section.title] || '#A78BFA';
              return (
                <div key={section.title}>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 mb-1.5">
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-[0.2em] font-bold">
                        {section.title}
                      </p>
                      <div className="flex-1 h-px bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="w-8 h-px bg-white/10 mb-2 mx-auto" />
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavItemComponent key={item.path} item={item} collapsed={isCollapsed} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 text-white/40">
                <Clock className="w-3 h-3 text-monarch-glow/70" />
                <span className="font-mono text-[10px] tracking-widest text-flicker">{clockStr}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F1F5F9] transition-all hover:scale-105"
              >
                {isLightMode ? <Sun className="w-3.5 h-3.5 text-cyan" /> : <Moon className="w-3.5 h-3.5 text-[#A78BFA]" />}
              </button>
              <button
                onClick={toggleSidebar}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F1F5F9] transition-all hover:scale-105"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <PlayerCard {...playerCardProps} compact={isCollapsed} />
        </div>
      </nav>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-void/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <CrownIcon />
          <span className="font-display font-bold text-[12px] tracking-[0.12em] text-[#A78BFA] glow-text uppercase">
            Monarch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/30 tracking-widest">{clockStr}</span>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-white/5 border border-white/10 text-white rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-sm md:hidden"
            />
            <motion.nav
              drag="x"
              dragConstraints={{ left: -256, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_e, info) => { if (info.offset.x < -80) setIsMobileOpen(false); }}
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 border-r border-white/5 p-5 z-50 flex flex-col justify-between md:hidden cursor-grab active:cursor-grabbing"
              style={{ background: 'var(--color-abyss)', willChange: 'transform' }}
            >
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-full bg-white/10" />
              <div className="space-y-5 flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center">
                    <CrownIcon />
                    <span className="font-display font-bold text-[12px] tracking-[0.12em] text-[#A78BFA] glow-text uppercase">Monarch</span>
                  </div>
                  <button onClick={() => setIsMobileOpen(false)} className="p-1 text-[#94A3B8] hover:text-[#F1F5F9]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
                  {NAV_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <p className="px-3 mb-1.5 font-mono text-[8px] text-white/20 uppercase tracking-[0.2em] font-bold">
                        {section.title}
                      </p>
                      <div className="space-y-0.5">
                        {section.items.map((item) => (
                          <NavItemComponent key={item.path} item={item} onClick={handleNavClick} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="font-body text-xs text-[#94A3B8]">Theme</span>
                  <button onClick={toggleTheme} className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8]">
                    {isLightMode ? <Sun className="w-4 h-4 text-cyan" /> : <Moon className="w-4 h-4 text-[#A78BFA]" />}
                  </button>
                </div>
                <PlayerCard {...playerCardProps} />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <div className="h-14 md:hidden" />
    </>
  );
};
