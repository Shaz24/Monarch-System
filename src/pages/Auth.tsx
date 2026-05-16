import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-accent-blue/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-accent-purple/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 rounded-none border-t-2 border-t-accent-blue shadow-neon-blue relative">
          
          {/* Header */}
          <div className="text-center mb-10">
            <img src="/monarch-logo.png" alt="Monarch Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border border-accent-blue/50 shadow-[0_0_20px_rgba(0,212,255,0.4)] object-cover" />
            <h1 className="text-4xl font-orbitron font-bold tracking-widest text-white uppercase mb-2">
              Monarch <span className="text-accent-blue">System</span>
            </h1>
            <p className="font-space-mono text-accent-blue/70 text-sm tracking-widest uppercase">
              {isLogin ? 'Initialize Connection' : 'Register New Player'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-accent-blue/50" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-void/50 border-b border-accent-blue/30 focus:border-accent-blue focus:outline-none focus:ring-0 pl-10 py-3 text-white font-space-mono placeholder:text-white/20 transition-colors"
                  placeholder="PLAYER_EMAIL"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-accent-blue/50" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-void/50 border-b border-accent-blue/30 focus:border-accent-blue focus:outline-none focus:ring-0 pl-10 py-3 text-white font-space-mono placeholder:text-white/20 transition-colors"
                  placeholder="SECURITY_KEY"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center gap-2 mt-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn className="w-5 h-5" /> LOGIN</>
              ) : (
                <><UserPlus className="w-5 h-5" /> REGISTER</>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <span className="w-1/5 border-b border-white/10 lg:w-1/4"></span>
            <span className="text-xs text-center text-white/40 uppercase font-space-mono tracking-widest">
              or connect via
            </span>
            <span className="w-1/5 border-b border-white/10 lg:w-1/4"></span>
          </div>

          <button
            onClick={handleGoogleAuth}
            type="button"
            className="w-full mt-6 btn-ghost text-sm font-space-mono flex items-center justify-center gap-3 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-space-mono text-accent-blue/60 hover:text-accent-blue hover:underline uppercase tracking-wider transition-colors"
            >
              {isLogin ? 'Create a new account' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
