import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Brain, Swords, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  {
    icon: Shield,
    title: 'Physical Conditioning',
    description: 'Track workouts, convert sweat into raw STR and END metrics.',
    color: 'text-[#00D4FF]',
    border: 'border-[#00D4FF]',
  },
  {
    icon: Brain,
    title: 'Mental Fortitude',
    description: 'Engage Monk Mode. Build STO and FOC through deep meditation.',
    color: 'text-[#7B2FFF]',
    border: 'border-[#7B2FFF]',
  },
  {
    icon: Swords,
    title: 'Boss Encounters',
    description: 'Take down massive Class-S life projects for immense XP bounties.',
    color: 'text-[#ff003c]',
    border: 'border-[#ff003c]',
  }
];

export default function Landing() {
  const { session } = useAuthStore();

  // If already authenticated, they can still view landing, or we can redirect
  // Let's allow them to view it but change the CTA
  
  return (
    <div className="min-h-screen bg-void flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00D4FF]/10 via-void to-void pointer-events-none" />
      <div className="absolute inset-0 bg-scanline-pattern opacity-30 pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:px-12 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/monarch-logo.png" alt="Monarch Logo" className="w-8 h-8 rounded-full border border-accent-blue/50 shadow-[0_0_15px_rgba(0,212,255,0.3)] object-cover" />
          <span className="font-orbitron font-bold text-lg tracking-widest text-white uppercase">
            Monarch <span className="text-accent-blue">System</span>
          </span>
        </div>
        <div>
          {session ? (
            <Link to="/dashboard" className="btn-ghost text-sm py-2 px-6">
              Enter System
            </Link>
          ) : (
            <Link to="/auth" className="btn-ghost text-sm py-2 px-6">
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
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-block mb-4 px-4 py-1 bg-accent-blue/10 border border-accent-blue/30 font-space-mono text-accent-blue text-xs uppercase tracking-[0.3em] rounded-full">
            Protocol V1.0 Online
          </div>
          <h1 className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
            Gamify Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
              Reality
            </span>
          </h1>
          <p className="font-space-mono text-sm md:text-base text-white/50 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed mb-12">
            A brutal, high-contrast productivity engine designed for extreme performers. Transform daily habits into XP, rank up your core stats, and conquer the system.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {session ? (
              <Link to="/dashboard" className="btn-primary py-4 px-8 text-lg w-full sm:w-auto flex items-center justify-center gap-2">
                RESUME SESSION <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/auth" className="btn-primary py-4 px-8 text-lg w-full sm:w-auto flex items-center justify-center gap-2 group">
                INITIATE LINK <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a href="#features" className="font-space-mono text-xs text-white/40 uppercase tracking-widest hover:text-white transition-colors">
              Read Documentation
            </a>
          </div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-void/80 backdrop-blur-md py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className={`glass-panel p-8 border-t-2 ${feat.border} hover:-translate-y-2 transition-transform duration-300`}
              >
                <Icon className={`w-10 h-10 ${feat.color} mb-6`} />
                <h3 className="font-orbitron font-bold text-xl text-white uppercase tracking-widest mb-3">
                  {feat.title}
                </h3>
                <p className="font-space-mono text-sm text-white/50 leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="font-space-mono text-xs text-white/30 uppercase tracking-widest">
          Monarch System © 2026. Built by System Architect.
        </p>
      </footer>
    </div>
  );
}
