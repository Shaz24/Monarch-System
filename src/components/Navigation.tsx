import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Brain, Terminal, Video, Swords, LineChart, User, Sun, Moon, Menu, X, Flame, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useProfile } from '../hooks/useProfile';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',   color: '#A78BFA', glow: 'rgba(124,58,237,0.25)' },
  { path: '/schedule',   icon: Calendar,         label: 'Directives', color: '#A78BFA', glow: 'rgba(124,58,237,0.25)' },
  { path: '/fitness',    icon: Dumbbell,         label: 'Physical',   color: '#EF4444', glow: 'rgba(239,68,68,0.25)' },
  { path: '/mind',       icon: Brain,            label: 'Mental',     color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
  { path: '/coding',     icon: Terminal,         label: 'Engineering',color: '#06B6D4', glow: 'rgba(6,182,212,0.25)' },
  { path: '/creator',    icon: Video,            label: 'Broadcast',  color: '#F97316', glow: 'rgba(249,115,22,0.25)' },
  { path: '/boss-mode',  icon: Swords,           label: 'Boss Mode',  color: '#DC2626', glow: 'rgba(220,38,38,0.25)' },
  { path: '/analytics',  icon: LineChart,        label: 'Analytics',  color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
  { path: '/profile',    icon: User,             label: 'Profile',    color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
];

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gold glow-gold mr-2 flex-shrink-0 animate-pulse">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

// Mini ring progress around avatar
const AvatarRing = ({ percent, initials, avatarUrl }: { percent: number; initials: string; avatarUrl?: string }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke="url(#xpRingGrad)" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="xpRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-1.5 rounded-full bg-[#4C1D95] border border-[#A78BFA]/30 flex items-center justify-center overflow-hidden">
        {avatarUrl
          ? <img src={avatarUrl} alt="av" className="w-full h-full object-cover" />
          : <span className="text-[10px] font-display font-bold text-white/90">{initials}</span>
        }
      </div>
    </div>
  );
};

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const { profile } = useProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const isLightMode = theme === 'light';

  // Live clock
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

  const NavItem = ({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <NavLink key={item.path} to={item.path} className="block" onClick={onClick}>
        <motion.div
          whileTap={{ scale: 0.97 }}
          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-150 group cursor-pointer relative ${
            isActive
              ? 'text-white'
              : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
          }`}
          style={isActive ? {
            background: `linear-gradient(90deg, ${item.color}22, transparent)`,
            borderLeft: `2px solid ${item.color}`,
            boxShadow: `inset 0 0 20px ${item.glow}`,
          } : {}}
        >
          <Icon
            className={`w-[18px] h-[18px] mr-3 transition-all duration-150 ${isActive ? '' : 'text-[#94A3B8] group-hover:text-[#F1F5F9]'}`}
            style={isActive ? { color: item.color } : {}}
          />
          <span className="font-body text-xs font-medium tracking-wide">{item.label}</span>
          {isActive && (
            <motion.div
              layoutId="nav-active-dot"
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ background: item.color }}
            />
          )}
        </motion.div>
      </NavLink>
    );
  };

  const PlayerCard = () => (
    <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center gap-3">
        <AvatarRing percent={xpPercent} initials={initials} avatarUrl={avatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="font-body text-xs font-semibold text-[#F1F5F9] truncate">{userName}</p>
          <p className="font-display text-[9px] text-[#A78BFA] tracking-wider font-bold">SHADOW MONARCH</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-display text-[9px] text-[#F59E0B] font-bold">LVL {userLevel}</span>
            {streakDays > 0 && (
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-amber-400">
                <Flame className="w-2.5 h-2.5" /> {streakDays}d
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="text-white/20 hover:text-white/60 transition-colors"
        >
          <User className="w-3 h-3" />
        </button>
      </div>

      {/* XP Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase">
          <span>XP</span>
          <span>{userXp} / {nextLevelXp}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#A78BFA] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-50 p-5 justify-between"
        style={{ background: 'var(--color-abyss)', borderRight: '1px solid var(--color-border)' }}
      >
        <div className="space-y-6 flex flex-col flex-1 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center px-2 py-1">
            <CrownIcon />
            <span className="font-display font-bold text-[13px] tracking-[0.15em] text-[#A78BFA] glow-text uppercase">
              Monarch System
            </span>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 hide-scrollbar">
            {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} />)}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          {/* Live clock */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 text-white/30">
              <Clock className="w-3 h-3" />
              <span className="font-mono text-[10px] tracking-widest">{clockStr}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              {isLightMode ? <Sun className="w-3.5 h-3.5 text-cyan" /> : <Moon className="w-3.5 h-3.5 text-[#A78BFA]" />}
            </button>
          </div>

          <PlayerCard />
        </div>
      </nav>

      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-void/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-5">
        <div className="flex items-center">
          <CrownIcon />
          <span className="font-display font-bold text-[12px] tracking-[0.12em] text-[#A78BFA] glow-text uppercase">
            Monarch System
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-white/30 tracking-widest">{clockStr}</span>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-white/5 border border-white/10 text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
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
              style={{ background: 'var(--color-abyss)' }}
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

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 hide-scrollbar">
                  {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} onClick={handleNavClick} />)}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="font-body text-xs text-[#94A3B8]">Aesthetic Node</span>
                  <button onClick={toggleTheme} className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[#94A3B8]">
                    {isLightMode ? <Sun className="w-4 h-4 text-cyan" /> : <Moon className="w-4 h-4 text-[#A78BFA]" />}
                  </button>
                </div>
                <PlayerCard />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <div className="h-16 md:hidden" />
    </>
  );
};
