import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, UserPlus, LogIn, Shield, Zap, Swords } from 'lucide-react';
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
        toast.success('System connection established.');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Registration successful. Verify your email to enter the system.');
      }
    } catch (error: any) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Access denied: Email not confirmed. Please disable "Confirm email" in your Supabase Auth settings to test locally.', { duration: 6000 });
      } else {
        toast.error(error.message || 'System error. Access denied.');
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
      toast.error(error.message || 'OAuth error.');
    }
  };

  return (
    <div className="min-h-screen bg-void flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-monarch/8 via-void to-void pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-scanline-pattern opacity-15 pointer-events-none" />

      {/* Left Branding Panel — Desktop only */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-monarch/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md"
        >
          <img src="/monarch-logo.png" alt="Monarch Logo" className="w-16 h-16 mb-8 rounded-xl border border-monarch/30 shadow-[0_0_30px_rgba(124,58,237,0.3)] object-cover" />
          <h1 className="font-display text-4xl font-black uppercase tracking-wider text-white mb-4 leading-tight">
            Welcome to the<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-monarch-glow to-cyan">Monarch System</span>
          </h1>
          <p className="font-mono text-sm text-white/35 leading-relaxed mb-10">
            Transform your daily grind into an RPG experience. Level up your stats, earn XP, complete boss encounters, and become the strongest version of yourself.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: Shield, label: 'Track fitness, mental, and coding stats', color: '#A78BFA' },
              { icon: Zap, label: 'Earn XP for every completed directive', color: '#F59E0B' },
              { icon: Swords, label: 'Boss battles for monthly goals', color: '#EF4444' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: f.color + '15', border: `1px solid ${f.color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: f.color }} />
                  </div>
                  <span className="font-mono text-xs text-white/50">{f.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-3 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-monarch-glow/50 to-transparent" />

            {/* Header */}
            <div className="text-center mb-8">
              <img src="/monarch-logo.png" alt="Monarch Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl border border-monarch/40 shadow-[0_0_20px_rgba(124,58,237,0.3)] object-cover lg:hidden" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <h2 className="text-2xl font-display font-bold tracking-widest text-white uppercase mb-1">
                    {isLogin ? 'Initialize' : 'Register'}
                  </h2>
                  <p className="font-mono text-monarch-glow/60 text-xs tracking-widest uppercase">
                    {isLogin ? 'Establish system connection' : 'Create new player profile'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/25 group-focus-within:text-monarch-glow transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-monarch-glow/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-monarch-glow/20 rounded-xl pl-11 py-3.5 text-white font-mono text-sm placeholder:text-white/20 transition-all"
                    placeholder="PLAYER_EMAIL"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/25 group-focus-within:text-monarch-glow transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-monarch-glow/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-monarch-glow/20 rounded-xl pl-11 py-3.5 text-white font-mono text-sm placeholder:text-white/20 transition-all"
                    placeholder="SECURITY_KEY"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-monarch flex justify-center items-center gap-2 py-3.5 rounded-xl text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <><LogIn className="w-4 h-4" /> CONNECT</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> CREATE ACCOUNT</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[9px] text-white/25 uppercase font-mono tracking-widest">or connect via</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Google Auth */}
            <button
              onClick={handleGoogleAuth}
              type="button"
              className="w-full mt-4 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-white/70 hover:text-white text-sm font-mono flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle + Guest */}
            <div className="mt-6 text-center space-y-3">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-mono text-monarch-glow/50 hover:text-monarch-glow hover:underline uppercase tracking-wider transition-colors"
              >
                {isLogin ? 'Create a new account →' : '← Already have an account?'}
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
                  toast.success('Offline System Activated. Welcome, guest-player-1337.');
                }}
                className="text-[9px] font-mono text-white/20 hover:text-monarch/70 uppercase tracking-widest transition-colors block mx-auto py-1.5 border border-dashed border-white/10 hover:border-monarch/30 px-4 rounded-lg"
              >
                [ BYPASS: ENTER AS GUEST ]
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
