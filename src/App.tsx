import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { useAuthStore } from './store/authStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { seedInitialData } from './lib/seeder';
import { ProtectedRoute } from './components/ProtectedRoute';
import { XpParticles } from './components/XpParticles';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { useUIStore } from './store/uiStore';
import { Navigation } from './components/Navigation';
import { SkeletonCard } from './components/ui/Skeleton';

// Lazy-loaded Pages
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Fitness = lazy(() => import('./pages/Fitness'));
const Mind = lazy(() => import('./pages/Mind'));
const Coding = lazy(() => import('./pages/Coding'));
const Creator = lazy(() => import('./pages/Creator'));
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Landing = lazy(() => import('./pages/Landing'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const BossMode = lazy(() => import('./pages/BossMode'));

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col md:flex-row bg-void">
    <Navigation />
    <main className="flex-1 md:ml-64 pb-28 md:pb-0 overflow-y-auto overflow-x-hidden relative z-10">
      {children}
    </main>
  </div>
);

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const LazyPage = ({ Component }: { Component: React.ComponentType }) => (
  <Suspense fallback={
    <div className="p-8">
      <SkeletonCard height="h-64" />
    </div>
  }>
    <PageTransition>
      <Component />
    </PageTransition>
  </Suspense>
);

function AppContent() {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LazyPage Component={Landing} />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <LazyPage Component={Auth} />} />
          
          <Route path="/dashboard" element={<ProtectedLayout><LazyPage Component={Dashboard} /></ProtectedLayout>} />
          <Route path="/schedule" element={<ProtectedLayout><LazyPage Component={Schedule} /></ProtectedLayout>} />
          <Route path="/fitness" element={<ProtectedLayout><LazyPage Component={Fitness} /></ProtectedLayout>} />
          <Route path="/mind" element={<ProtectedLayout><LazyPage Component={Mind} /></ProtectedLayout>} />
          <Route path="/coding" element={<ProtectedLayout><LazyPage Component={Coding} /></ProtectedLayout>} />
          <Route path="/creator" element={<ProtectedLayout><LazyPage Component={Creator} /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><LazyPage Component={Profile} /></ProtectedLayout>} />
          <Route path="/boss-mode" element={<ProtectedLayout><LazyPage Component={BossMode} /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><LazyPage Component={Analytics} /></ProtectedLayout>} />
          <Route path="/edit-profile" element={<ProtectedLayout><LazyPage Component={EditProfile} /></ProtectedLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <XpParticles />
      <LevelUpOverlay />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(17,24,39,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F1F5F9',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            boxShadow: '0 0 24px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#080B12' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#080B12' },
          },
        }} 
      />
    </div>
  );
}

function App() {
  const setOffline = useAppStore(state => state.setOffline);
  const { setUser, setSession, setLoading } = useAuthStore();
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
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

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
      <AppContent />
    </Router>
  );
}

export default App;
