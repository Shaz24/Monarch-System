import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { useAuthStore } from './store/authStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { seedInitialData } from './lib/seeder';
import { ProtectedRoute } from './components/ProtectedRoute';
import { XpParticles } from './components/XpParticles';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { useUIStore } from './store/uiStore';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Fitness from './pages/Fitness';
import Mind from './pages/Mind';
import Coding from './pages/Coding';
import Creator from './pages/Creator';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';
import EditProfile from './pages/EditProfile';
import BossMode from './pages/BossMode';
import { Navigation } from './components/Navigation';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col md:flex-row">
    <Navigation />
    <main className="flex-1 md:ml-28 pb-28 md:pb-0 overflow-y-auto overflow-x-hidden relative">
      {children}
    </main>
  </div>
);

// Protected layout: guards route + injects navigation
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  const setOffline = useAppStore(state => state.setOffline);
  const { user, setUser, setSession, setLoading } = useAuthStore();
  const theme = useUIStore(state => state.theme);

  useEffect(() => {
    const htmlEl = document.documentElement;
    if (theme === 'light') {
      htmlEl.classList.add('light-mode');
    } else {
      htmlEl.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // No valid Supabase config — skip auth, render app unauthenticated
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          seedInitialData(session.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    let sub: { unsubscribe: () => void } | null = null;
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          seedInitialData(session.user);
        }
        setLoading(false);
      });
      sub = subscription;
    } catch (e) {
      setLoading(false);
    }

    return () => sub?.unsubscribe();
  }, [setSession, setUser, setLoading]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
        
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/schedule" element={<ProtectedLayout><Schedule /></ProtectedLayout>} />
        <Route path="/fitness" element={<ProtectedLayout><Fitness /></ProtectedLayout>} />
        <Route path="/mind" element={<ProtectedLayout><Mind /></ProtectedLayout>} />
        <Route path="/coding" element={<ProtectedLayout><Coding /></ProtectedLayout>} />
        <Route path="/creator" element={<ProtectedLayout><Creator /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/boss-mode" element={<ProtectedLayout><BossMode /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
        <Route path="/edit-profile" element={<ProtectedLayout><EditProfile /></ProtectedLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <XpParticles />
      <LevelUpOverlay />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#080D1A',
            color: '#00D4FF',
            border: '1px solid #00D4FF',
            fontFamily: 'Share Tech Mono, monospace',
          }
        }} 
      />
    </Router>
  );
}

export default App;
