import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Brain, Swords, ChevronRight, Zap, BarChart3, Flame, Trophy, Activity, Sparkles, Terminal, Compass } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

const FEATURES = [
  {
    icon: Shield,
    title: 'Physical Conditioning',
    description: 'Track workouts, convert sweat into raw STR and END metrics. Build your body like an S-Rank weapon.',
    color: '#EF4444',
    tag: 'STR & END',
    rank: 'S-RANK',
  },
  {
    icon: Brain,
    title: 'Mental Fortitude',
    description: 'Engage Monk Mode. Build STO and FOC through deep meditation and cognitive resistance training.',
    color: '#8B5CF6',
    tag: 'STO & FOC',
    rank: 'A-RANK',
  },
  {
    icon: Swords,
    title: 'Boss Encounters',
    description: 'Take down massive Class-S life projects for immense XP bounties and legendary loot drops.',
    color: '#DC2626',
    tag: 'RAID COMBAT',
    rank: 'SPECIAL',
  },
  {
    icon: Zap,
    title: 'XP Economy',
    description: 'Every completed action earns XP. Level up your stats, unlock new ranks, and awaken your latent potential.',
    color: '#F59E0B',
    tag: 'LEVELING',
    rank: 'PROTOCOL',
  },
  {
    icon: BarChart3,
    title: 'Analytics Engine',
    description: 'Deep neural insights into your performance. Stat radar charts, contribution heatmaps, and velocity tracking.',
    color: '#10B981',
    tag: 'DIAGNOSTICS',
    rank: 'INTELLIGENCE',
  },
  {
    icon: Flame,
    title: 'Streak System',
    description: 'Never break the chain. Maintain your daily streak for exponential XP multipliers and aura rewards.',
    color: '#F97316',
    tag: 'AURA MULTIPLIER',
    rank: 'CORE',
  },
];

const STATS = [
  { label: 'Active Hunters', num: 2847, suffix: '+', icon: Trophy, color: '#F59E0B' },
  { label: 'Directives Cleared', num: 184, suffix: 'K', icon: Swords, color: '#EF4444' },
  { label: 'XP Generated', num: 12.4, suffix: 'M', decimals: 1, icon: Zap, color: '#A78BFA' },
  { label: 'Bosses Slain', num: 940, suffix: '+', icon: Flame, color: '#F97316' },
];

export default function Landing() {
  const { session } = useAuthStore();

  return (
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden text-slate-100 selection:bg-monarch selection:text-white">
      {/* Background Animated Perspective Grid & Volumetric Orbs */}
      <div className="ambient-orb top-[-140px] left-1/2 -translate-x-1/2 w-[850px] h-[850px] bg-monarch/12 pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="ambient-orb top-[30%] left-[-160px] w-[650px] h-[650px] bg-cyan-500/8 pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="ambient-orb bottom-10 right-[-140px] w-[700px] h-[700px] bg-amber-500/7 pointer-events-none" style={{ animationDelay: '4s' }} />
      
      {/* Cyber Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(to right, #A78BFA 1px, transparent 1px), linear-gradient(to bottom, #A78BFA 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute inset-0 bg-scanline-pattern opacity-15 pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-30 flex items-center justify-between p-5 md:px-12 backdrop-blur-2xl border-b border-white/[0.08] bg-void/85">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-monarch/20 border border-monarch-glow/60 flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)]">
              <Zap className="w-5 h-5 text-monarch-glow" />
            </div>
            <div className="absolute -inset-1 rounded-xl border border-monarch-glow/40 animate-ping opacity-30 pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <span className="font-orbitron font-black text-lg tracking-[0.18em] text-white uppercase leading-none glow-text-monarch">
              Monarch <span className="text-cyan-400">System</span>
            </span>
            <span className="font-mono-tech text-[8px] text-white/50 tracking-[0.28em] uppercase mt-0.5">
              Protocol V2.5 • Diegetic Hunter HUD
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <Link to="/dashboard" className="btn-hunter text-xs py-2.5 px-6 rounded-lg">
              <Compass className="w-4 h-4 text-cyan-300" />
              COMMAND CENTER <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:inline-flex font-rajdhani font-semibold text-sm text-white/70 hover:text-white uppercase tracking-wider py-2 px-4 transition-colors">
                Terminal Login
              </Link>
              <Link to="/auth" className="btn-hunter text-xs py-2.5 px-6 rounded-lg">
                <Terminal className="w-3.5 h-3.5 text-cyan-300" />
                AWAKEN NOW <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section with Holographic HUD Preview */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-20 px-6 text-center pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          {/* Top System Notification Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 bg-monarch/15 border border-monarch-glow/40 font-mono-tech text-monarch-glow text-xs uppercase tracking-[0.25em] rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>[ SYSTEM NOTIFICATION: HUNTER AWAKENING ACTIVE ]</span>
          </div>

          <h1 className="font-orbitron text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-6 leading-[0.94]">
            GAMIFY YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-monarch-glow via-cyan-400 to-[#F59E0B] drop-shadow-[0_0_40px_rgba(124,58,237,0.7)]">
              REALITY
            </span>
          </h1>

          <p className="font-chakra text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto uppercase tracking-wider leading-relaxed mb-10">
            A high-contrast neural productivity engine inspired by Solo Leveling. Transform daily discipline into XP, level up your attributes, and claim the throne.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
            {session ? (
              <Link to="/dashboard" className="btn-hunter py-4 px-10 text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl">
                ENTER COMMAND CENTER <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/auth" className="btn-hunter py-4 px-10 text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2 group rounded-xl">
                INITIATE AWAKENING LINK <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a href="#features" className="btn-tech-outline text-xs text-white/70 uppercase tracking-widest hover:text-white transition-colors py-3.5 px-6 rounded-xl">
              Explore Modules ↓
            </a>
          </div>

          {/* ══ HOLOGRAPHIC HUNTER HUD PREVIEW WIDGET ══ */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl holo-bracket-box holo-breathe p-6 md:p-8 rounded-2xl relative overflow-hidden text-left"
          >
            {/* Hologram scanline and laser sweep */}
            <div className="scan-sweep-beam" />
            <div className="absolute inset-0 bg-scanline-pattern opacity-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-monarch-dim border border-monarch-glow/50 flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)]">
                    <Shield className="w-8 h-8 text-amber-400" />
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[9px] px-2 py-0.5 rounded font-orbitron shadow-md">
                    S-CLASS
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-[10px] text-monarch-glow uppercase tracking-widest font-bold">
                      SHADOW MONARCH • LVL 85
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="font-rajdhani text-2xl md:text-3xl font-black text-white uppercase tracking-wider glow-text-monarch">
                    SUNG_JINWOO
                  </h3>
                  <p className="font-mono-tech text-[11px] text-white/50">Status: Dominant • Aura Multiplier: 2.5x</p>
                </div>
              </div>

              {/* Live XP meter in preview */}
              <div className="w-full md:w-64 space-y-1.5 bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <div className="flex justify-between font-mono-tech text-[10px]">
                  <span className="text-white/50">XP PROGRESS</span>
                  <span className="text-amber-400 font-bold">8,450 / 10,000 XP</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 rounded-full" style={{ width: '84.5%' }} />
                </div>
                <div className="flex justify-between font-mono-tech text-[9px] text-white/40">
                  <span>RANK ADVANCEMENT</span>
                  <span className="text-cyan-400 font-bold">84.5%</span>
                </div>
              </div>
            </div>

            {/* Sub-grid of active directives */}
            <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-mono-tech text-[9px] text-white/40 uppercase">Physical Quest</p>
                  <p className="font-rajdhani text-sm font-bold text-white tracking-wide">100 Pushups / 10km</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-mono-tech text-[9px] text-white/40 uppercase">Monk Mode</p>
                  <p className="font-rajdhani text-sm font-bold text-white tracking-wide">4h Deep Coding Focus</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-mono-tech text-[9px] text-white/40 uppercase">Daily Streak</p>
                  <p className="font-rajdhani text-sm font-bold text-amber-400 tracking-wide">🔥 42 Days Active</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Stats Bar */}
      <div className="relative z-20 border-y border-white/10 bg-void/90 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="py-7 px-6 text-center group cursor-default transition-all hover:bg-white/[0.02]"
              >
                <Icon className="w-6 h-6 mx-auto mb-2 filter drop-shadow-[0_0_10px_rgba(124,58,237,0.6)] group-hover:scale-110 transition-transform" style={{ color: stat.color }} />
                <p className="font-orbitron text-2xl md:text-3xl font-black text-white glow-text-monarch">
                  <AnimatedCounter value={stat.num} suffix={stat.suffix} decimals={stat.decimals || 0} />
                </p>
                <p className="font-rajdhani font-semibold text-xs text-white/50 uppercase tracking-widest mt-1.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="relative z-20 bg-void/95 backdrop-blur-xl py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono-tech text-[10px] text-monarch-glow uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3 text-amber-400" />
              SYSTEM MODULES
            </div>
            <h2 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white mb-4 glow-text-monarch">
              ENGINEERED FOR <span className="text-cyan-400">APEX PERFORMANCE</span>
            </h2>
            <p className="font-rajdhani font-medium text-sm md:text-base text-white/50 uppercase tracking-widest max-w-xl mx-auto">
              Every dimension of human mastery transformed into a high-stakes RPG leveling loop.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="holo-bracket-box p-7 rounded-2xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-200"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }} />
                  <div className="absolute top-0 left-0 w-36 h-36 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: feat.color + '25' }} />

                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: feat.color + '18', border: `1px solid ${feat.color}40`, boxShadow: `0 0 20px ${feat.color}25` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: feat.color, filter: `drop-shadow(0 0 6px ${feat.color}80)` }} />
                    </div>
                    <span className="font-orbitron text-[9px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70 uppercase font-bold tracking-wider">
                      {feat.rank}
                    </span>
                  </div>

                  <h3 className="font-rajdhani font-bold text-xl text-white uppercase tracking-wider mb-2 group-hover:text-monarch-glow transition-colors">
                    {feat.title}
                  </h3>
                  <p className="font-chakra text-xs text-white/60 leading-relaxed mb-4">
                    {feat.description}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono-tech text-[10px] text-white/40 uppercase tracking-widest">{feat.tag}</span>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 border-t border-white/10 py-28 px-6 text-center overflow-hidden bg-void/90">
        <div className="ambient-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-monarch/15 pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto relative z-10 holo-bracket-box p-10 md:p-14 rounded-3xl"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full font-mono-tech text-[10px] text-amber-400 uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            FINAL PROTOCOL INITIATION
          </div>
          <h2 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white mb-4 glow-text-monarch">
            READY TO <span className="text-cyan-400">AWAKEN</span>?
          </h2>
          <p className="font-rajdhani font-semibold text-sm md:text-base text-white/60 uppercase tracking-widest mb-9 max-w-lg mx-auto">
            Join the elite hunters operating at maximum cognitive, physical, and engineering output.
          </p>
          {session ? (
            <Link to="/dashboard" className="btn-hunter py-4 px-12 text-base font-bold rounded-xl">
              ENTER SYSTEM COMMAND <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/auth" className="btn-hunter py-4 px-12 text-base font-bold rounded-xl">
              AWAKEN AS A HUNTER <ChevronRight className="w-5 h-5" />
            </Link>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 py-8 text-center bg-black/80">
        <p className="font-mono-tech text-xs text-white/40 uppercase tracking-widest">
          Monarch System © {new Date().getFullYear()} • Built for Extreme Performers • All Systems Operational
        </p>
      </footer>
    </div>
  );
}
