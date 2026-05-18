import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense, useState } from 'react';
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

// Global Overhaul Elements
import { SystemBootFlash } from './components/SystemBootFlash';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Bell, Search, Keyboard } from 'lucide-react';

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
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
  const navigate = useNavigate();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          navigate('/boss-mode');
        } else if (key === 's') {
          navigate('/schedule');
        } else if (key === 'm') {
          navigate('/mind');
        } else if (key === 'f') {
          navigate('/fitness');
        } else if (key === 'c') {
          navigate('/coding');
        } else if (key === 'r') {
          navigate('/creator');
        } else if (key === 'd') {
          navigate('/dashboard');
        } else if (key === 'p') {
          navigate('/profile');
        } else if (key === 'a') {
          navigate('/analytics');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="relative min-h-screen">
      <SystemBootFlash />
      
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

      {/* Floating Control Hub */}
      {user && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex flex-col gap-3">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="w-11 h-11 rounded-full bg-void/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            title="Search command palette (Ctrl+K)"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="w-11 h-11 rounded-full bg-void/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-monarch hover:text-monarch/80 hover:border-monarch/30 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-11 h-11 rounded-full bg-void/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-gold hover:text-gold/80 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
            title="System notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Overlays / Drawers */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

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
