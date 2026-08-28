import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, UserPlus, LogIn, Shield, Zap, Swords, Terminal, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const { user } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('[SYSTEM: CONNECTION ESTABLISHED] Welcome Hunter.');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('[SYSTEM: REGISTRATION INITIATED] Verify credentials.');
      }
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        toast.error('[SYSTEM: ACCESS DENIED] Email not confirmed. Test with Guest Hunter bypass.', { duration: 6000 });
      } else {
        toast.error(`[ERROR: ${error.message?.toUpperCase() || 'ACCESS DENIED'}]`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(`[AUTH ERROR: ${error.message?.toUpperCase() || 'OAUTH FAILED'}]`);
    }
  };

  return (
    <div className="min-h-screen bg-void flex relative overflow-hidden text-slate-100 selection:bg-monarch selection:text-white">
      {/* Background Holographic Glows & Ambient Orbs */}
      <div className="ambient-orb top-[-100px] left-1/4 w-[700px] h-[700px] bg-monarch/12 pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="ambient-orb bottom-[-100px] right-1/4 w-[600px] h-[600px] bg-cyan-500/8 pointer-events-none" style={{ animationDelay: '3s' }} />
      <div className="absolute top-0 left-0 w-full h-full bg-scanline-pattern opacity-20 pointer-events-none" />

      {/* Cyber Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(to right, #A78BFA 1px, transparent 1px), linear-gradient(to bottom, #A78BFA 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Left Branding Panel — Cyber Awakening Terminal */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative p-12 overflow-hidden border-r border-white/[0.08] bg-void/70 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-monarch/15 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-md w-full"
        >
          {/* Holographic Awakening Crest */}
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-monarch-dim to-void border border-monarch-glow/60 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)] hunter-aura">
              <Zap className="w-12 h-12 text-monarch-glow filter drop-shadow-[0_0_15px_rgba(167,139,250,0.8)]" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-monarch-glow/30 border-glow-cycle pointer-events-none" />
          </div>

          <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 bg-monarch/15 border border-monarch-glow/40 font-mono-tech text-monarch-glow text-[10px] uppercase tracking-[0.25em] rounded-full shadow-[0_0_15px_rgba(124,58,237,0.25)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            HUNTER AWAKENING GATEWAY
          </div>

          <h1 className="font-orbitron text-4xl font-black uppercase tracking-wider text-white mb-3 leading-tight glow-text-monarch">
            ENTER THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-monarch-glow via-cyan-400 to-amber-400">
              MONARCH PROTOCOL
            </span>
          </h1>
          <p className="font-chakra text-sm text-white/60 leading-relaxed mb-8">
            The neural gamification layer for extreme performers. Level up your discipline, physical strength, and engineering mastery under the Shadow Monarch.
          </p>

          {/* Holographic ID Preview Card */}
          <div className="holo-bracket-box p-4 rounded-xl mb-6 relative overflow-hidden">
            <div className="scan-sweep-beam" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                <span className="font-mono-tech text-xs text-white/80 uppercase font-bold tracking-wider">HUNTER IDENTITY CARD</span>
              </div>
              <span className="font-orbitron text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                CLASS: S
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono-tech text-[10px]">
              <div>
                <span className="text-white/40 block">STATUS</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
              <div>
                <span className="text-white/40 block">GATEWAY</span>
                <span className="text-cyan-400 font-bold">SECURE</span>
              </div>
              <div>
                <span className="text-white/40 block">LATENCY</span>
                <span className="text-monarch-glow font-bold">12ms</span>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              { icon: Shield, title: 'ATTRIBUTE MATRIX', desc: 'Real-time STR, END, STO, & FOC stat progression', color: '#A78BFA' },
              { icon: Zap, title: 'XP ECONOMY', desc: 'Instant reward feedback for every conquered directive', color: '#F59E0B' },
              { icon: Swords, title: 'CLASS-S RAIDS', desc: 'Monthly boss battles with immense bounty drops', color: '#EF4444' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-monarch-glow/30 transition-all hover:bg-white/[0.04]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: f.color + '18', border: `1px solid ${f.color}40`, boxShadow: `0 0 12px ${f.color}25` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: f.color }} />
                  </div>
                  <div>
                    <span className="font-rajdhani text-sm font-bold text-white tracking-wider block">{f.title}</span>
                    <span className="font-mono-tech text-[10px] text-white/50 block mt-0.5">{f.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="holo-bracket-box p-8 md:p-10 rounded-2xl relative overflow-hidden">
            <div className="scan-sweep-beam" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block lg:hidden mb-4">
                <div className="w-16 h-16 rounded-2xl bg-monarch-dim border border-monarch-glow/60 flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] mx-auto">
                  <Zap className="w-8 h-8 text-monarch-glow" />
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono-tech text-[10px] text-cyan-300 uppercase tracking-widest mb-2">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>SYS_TERMINAL_V2</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-orbitron font-black tracking-widest text-white uppercase mb-1.5 glow-text-monarch">
                    {isLogin ? 'AUTHENTICATE' : 'AWAKEN'}
                  </h2>
                  <p className="font-rajdhani text-monarch-glow text-sm tracking-widest uppercase font-bold flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {isLogin ? 'Establish Hunter Connection' : 'Register New Player Profile'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group input-tech-glow rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Mail className="h-4 w-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-cyan-400 focus:bg-white/[0.05] focus:outline-none rounded-xl pl-12 pr-4 py-3.5 text-white font-mono-tech text-sm placeholder:text-white/30 transition-all shadow-inner"
                    placeholder="PLAYER_EMAIL"
                  />
                </div>

                <div className="relative group input-tech-glow rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-cyan-400 focus:bg-white/[0.05] focus:outline-none rounded-xl pl-12 pr-4 py-3.5 text-white font-mono-tech text-sm placeholder:text-white/30 transition-all shadow-inner"
                    placeholder="SECURITY_KEY"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-hunter flex justify-center items-center gap-2 py-4 rounded-xl text-sm font-bold tracking-widest cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <><LogIn className="w-4 h-4" /> INITIATE LINK</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> INITIALIZE AWAKENING</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9px] text-white/40 uppercase font-mono-tech tracking-widest">or authorize via</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Auth */}
            <button
              onClick={handleGoogleAuth}
              type="button"
              className="w-full mt-4 bg-white/[0.03] border border-white/15 hover:border-monarch-glow/50 hover:bg-white/[0.07] text-white/90 hover:text-white text-xs font-mono-tech font-bold flex items-center justify-center gap-3 py-3.5 rounded-xl transition-all shadow-lg group relative overflow-hidden cursor-pointer"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            {/* Toggle + Guest */}
            <div className="mt-6 text-center space-y-3.5">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-rajdhani font-semibold text-monarch-glow hover:text-cyan-300 uppercase tracking-wider transition-colors cursor-pointer block mx-auto"
              >
                {isLogin ? '→ Register New Hunter Profile' : '← Return to Login'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  const guestUser = {
                    id: 'guest-player-1337',
                    email: 'guest@monarch.system',
                    aud: 'authenticated',
                    role: 'authenticated',
                    app_metadata: {},
                    user_metadata: {},
                    created_at: new Date().toISOString()
                  };
                  useAuthStore.getState().setUser(guestUser as any);
                  useAuthStore.getState().setSession({
                    access_token: 'guest-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'guest-refresh',
                    user: guestUser as any
                  });
                  toast.success('[SYSTEM: OFFLINE HUNTER PROTOCOL ACTIVE] Welcome, Hunter-1337.');
                }}
                className="text-[10px] font-mono-tech text-white/50 hover:text-amber-400 uppercase tracking-widest transition-colors block mx-auto py-2.5 border border-dashed border-amber-500/30 hover:border-amber-500/60 px-6 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]"
              >
                [ BYPASS: ENTER AS GUEST HUNTER ]
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
