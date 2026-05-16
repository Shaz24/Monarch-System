import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Brain, Terminal, Video, Swords, LineChart, User } from 'lucide-react';

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
  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-void border-r border-white/10 z-40 overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-orbitron font-bold text-xl uppercase tracking-widest text-white">
            Monarch <span className="text-accent-blue">System</span>
          </h1>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-4 px-4 py-3 font-space-mono text-sm uppercase tracking-widest transition-all duration-300 border-l-2 ${
                    isActive 
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue shadow-[inset_4px_0_10px_rgba(0,212,255,0.2)]' 
                      : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-void border-t border-white/10 z-40 flex justify-between px-2 py-2 overflow-x-auto pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors ${
                  isActive ? 'text-accent-blue' : 'text-white/50'
                }`
              }
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-space-mono uppercase tracking-wider">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
