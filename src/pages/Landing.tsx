import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Brain, Swords, ChevronRight, Zap, BarChart3, Flame, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  {
    icon: Shield,
    title: 'Physical Conditioning',
    description: 'Track workouts, convert sweat into raw STR and END metrics. Build your body like a weapon.',
    color: '#EF4444',
    gradient: 'from-red-500/20 to-transparent',
  },
  {
    icon: Brain,
    title: 'Mental Fortitude',
    description: 'Engage Monk Mode. Build STO and FOC through deep meditation and cognitive training.',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-transparent',
  },
  {
    icon: Swords,
    title: 'Boss Encounters',
    description: 'Take down massive Class-S life projects for immense XP bounties and rare loot drops.',
    color: '#DC2626',
    gradient: 'from-red-600/20 to-transparent',
  },
  {
    icon: Zap,
    title: 'XP Economy',
    description: 'Every action earns XP. Level up your stats, unlock new ranks, and rise through the tiers.',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-transparent',
  },
  {
    icon: BarChart3,
    title: 'Analytics Engine',
    description: 'Deep insights into your performance. Radar charts, heatmaps, and velocity tracking.',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-transparent',
  },
  {
    icon: Flame,
    title: 'Streak System',
    description: 'Never break the chain. Maintain your streak for multiplied XP and exclusive rewards.',
    color: '#F97316',
    gradient: 'from-orange-500/20 to-transparent',
  },
];

const STATS = [
  { label: 'Active Hunters', value: '2,847', icon: Trophy },
  { label: 'Quests Completed', value: '184K', icon: Swords },
  { label: 'XP Generated', value: '12.4M', icon: Zap },
];

export default function Landing() {
  const { session } = useAuthStore();

  return (
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#7C3AED]/8 via-void to-void pointer-events-none" />
      <div className="absolute inset-0 bg-scanline-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-monarch/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-3">
          <img src="/monarch-logo.png" alt="Monarch Logo" className="w-8 h-8 rounded-full border border-monarch-glow/40 shadow-[0_0_15px_rgba(124,58,237,0.3)] object-cover" />
          <span className="font-display font-bold text-lg tracking-widest text-white uppercase">
            Monarch <span className="text-monarch-glow">System</span>
          </span>
        </div>
        <div>
          {session ? (
            <Link to="/dashboard" className="btn-ghost text-sm py-2 px-6 rounded-xl">
              Enter System
            </Link>
          ) : (
            <Link to="/auth" className="btn-monarch text-sm py-2.5 px-6 rounded-xl">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-monarch/10 border border-monarch/25 font-mono text-monarch-glow text-xs uppercase tracking-[0.25em] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Protocol V2.0 Online
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white mb-6 leading-[0.9]">
            Gamify Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-monarch-glow via-cyan to-[#F59E0B] drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              Reality
            </span>
          </h1>

          <p className="font-space-mono text-sm md:text-base text-white/40 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed mb-12">
            A brutal, high-contrast productivity engine designed for extreme performers. Transform daily habits into XP, rank up your core stats, and conquer the system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Link to="/dashboard" className="btn-monarch py-4 px-10 text-base w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                RESUME SESSION <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/auth" className="btn-monarch py-4 px-10 text-base w-full sm:w-auto flex items-center justify-center gap-2 group rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                INITIATE LINK <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a href="#features" className="font-space-mono text-xs text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors py-3 px-6">
              View Features ↓
            </a>
          </div>
        </motion.div>
      </main>

      {/* Stats Bar */}
      <div className="relative z-10 border-t border-white/5 bg-void/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-white/5">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="py-6 px-4 text-center"
              >
                <Icon className="w-4 h-4 text-monarch-glow mx-auto mb-2" />
                <p className="font-display text-xl md:text-2xl font-black text-white">{stat.value}</p>
                <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-void/80 backdrop-blur-md py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-wider text-white mb-3">
              System <span className="text-monarch-glow">Modules</span>
            </h2>
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Every dimension of self-improvement, gamified.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-2 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`absolute top-0 left-0 right-0 h-[2px]`} style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }} />
                  <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} style={{ background: feat.color + '15' }} />

                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: feat.color + '15', border: `1px solid ${feat.color}30` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feat.color }} />
                  </div>
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-widest mb-2">
                    {feat.title}
                  </h3>
                  <p className="font-space-mono text-xs text-white/40 leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-white/5 py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-wider text-white mb-4">
            Ready to <span className="text-monarch-glow">Level Up</span>?
          </h2>
          <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-8">Join the hunters who refuse to be average.</p>
          {session ? (
            <Link to="/dashboard" className="btn-monarch py-4 px-10 text-base rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              ENTER SYSTEM
            </Link>
          ) : (
            <Link to="/auth" className="btn-monarch py-4 px-10 text-base rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              CREATE ACCOUNT
            </Link>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="font-space-mono text-xs text-white/20 uppercase tracking-widest">
          Monarch System © 2026. Built by System Architect.
        </p>
      </footer>
    </div>
  );
}
