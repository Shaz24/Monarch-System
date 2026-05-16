import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Brain, Terminal, Video, Swords, LineChart, User } from 'lucide-react';
import { motion } from 'framer-motion';

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

export const Navigation = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Floating Glass Sidebar */}
      <nav className="hidden md:flex flex-col w-20 h-[calc(100vh-2rem)] fixed left-4 top-4 bg-void/40 backdrop-blur-xl border border-white/10 z-50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-center mt-2">
          <img src="/monarch-logo.png" alt="Monarch" className="w-10 h-10 rounded-xl border border-accent-blue/30 shadow-[0_0_15px_rgba(0,212,255,0.2)] object-cover" />
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 items-center overflow-y-auto hide-scrollbar relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex items-center justify-center w-12 h-12 rounded-xl group"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-desktop"
                    className="absolute inset-0 bg-accent-blue/10 border border-accent-blue/50 rounded-xl shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-accent-blue' : 'text-white/40 group-hover:text-white'
                  }`} 
                />
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-void/90 backdrop-blur-md border border-white/10 px-3 py-1.5 font-space-mono text-[10px] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 rounded-lg shadow-xl">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-void/90 border-l border-b border-white/10 rotate-45" />
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Glass Dock */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-void/60 backdrop-blur-xl border border-white/10 z-50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 snap-x items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center p-2 min-w-[64px] snap-center rounded-xl mx-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-mobile"
                    className="absolute inset-0 bg-accent-blue/10 border border-accent-blue/30 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={`w-5 h-5 mb-1 relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-accent-blue' : 'text-white/40'
                  }`} 
                />
                <span className={`text-[8px] font-space-mono uppercase tracking-wider relative z-10 transition-colors duration-300 ${isActive ? 'text-accent-blue' : 'text-white/30'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
