import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Gamepad2, UserPlus, LogIn } from 'lucide-react';
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
      toast.error(error.message || 'System error. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-accent-blue drop-shadow-md" />
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
            className="w-full mt-6 btn-ghost text-sm font-space-mono"
          >
            Google Network
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
