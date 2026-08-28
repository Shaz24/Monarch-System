import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { useUIStore } from '../store/uiStore';
import {
  Zap,
  Cpu,
  Activity,
  Layers,
  TrendingUp,
  GitBranch,
  Atom,
  FlaskConical,
  Sigma,
  Gauge,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   PARTICLE CANVAS — upward-drifting violet particles
───────────────────────────────────────────────────────────────── */
const ParticleCanvas = ({ dark }: { dark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLOR = dark ? '155,93,229' : '106,40,200';
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR},${p.opacity})`;
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = canvas.height + 5;
          p.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      id="ag-particles"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.45,
        zIndex: 0,
      }}
    />
  );
};

/* ─────────────────────────────────────────────────────────────────
   CENTRAL ORB STAT — animated SVG ring
───────────────────────────────────────────────────────────────── */
const OrbStat = ({ percent, value, label }: { percent: number; value: string; label: string }) => {
  const circum = 2 * Math.PI * 50; // r=50
  const offset = circum * (1 - Math.min(percent / 100, 1));

  return (
    <div className="ag-orb-container">
      <svg viewBox="0 0 120 120" width="180" height="180" className="ag-orb-svg">
        {/* Track */}
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke="var(--ag-track)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke="var(--color-ag-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circum}
          initial={{ strokeDashoffset: circum }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 60 60)"
          className="ag-progress-ring"
        />
      </svg>
      <div className="ag-orb-inner">
        <span className="ag-orb-value">{value}</span>
        <span className="ag-orb-label">{label}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   FLOATING CARD — with parallax tilt on hover
───────────────────────────────────────────────────────────────── */
const AgCard = ({
  children,
  delay = 0,
  badge,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  badge?: string;
  className?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-10px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'translateY(-4px) rotateX(0deg) rotateY(0deg)';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`ag-card ${className}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '800px' }}
    >
      {badge && <div className="ag-badge">{badge}</div>}
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MINI STAT CHIP
───────────────────────────────────────────────────────────────── */
const MiniStat = ({ value, label, icon: Icon }: { value: string; label: string; icon: any }) => (
  <div className="ag-mini-stat">
    <Icon className="ag-mini-stat-icon" />
    <span className="ag-mini-stat-value">{value}</span>
    <span className="ag-mini-stat-label">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   CAPABILITY ROW — protocol / skill row
───────────────────────────────────────────────────────────────── */
const CapabilityRow = ({
  icon: Icon,
  name,
  level,
  progress,
  tag,
}: {
  icon: any;
  name: string;
  level: number;
  progress: number;
  tag: string;
}) => (
  <div className="ag-cap-row">
    <div className="ag-cap-icon-wrap">
      <Icon className="ag-cap-icon" />
    </div>
    <div className="ag-cap-body">
      <div className="ag-cap-header">
        <span className="ag-cap-name">{name}</span>
        <span className="ag-cap-tag">{tag}</span>
      </div>
      <div className="ag-cap-bar-track">
        <motion.div
          className="ag-cap-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
        />
      </div>
    </div>
    <div className="ag-cap-level">
      <span className="ag-cap-level-num">LVL</span>
      <span className="ag-cap-level-val">{level}</span>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   PROTOCOL EVENT LOG ENTRY
───────────────────────────────────────────────────────────────── */
const LogEntry = ({
  timestamp,
  event,
  status,
  delay,
}: {
  timestamp: string;
  event: string;
  status: 'NOMINAL' | 'ACTIVE' | 'LOCKED';
  delay: number;
}) => (
  <motion.div
    className={`ag-log-entry ag-log-entry--${status.toLowerCase()}`}
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <span className="ag-log-ts">{timestamp}</span>
    <span className="ag-log-divider">›</span>
    <span className="ag-log-event">{event}</span>
    <span className={`ag-log-status ag-log-status--${status.toLowerCase()}`}>{status}</span>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
export default function Antigravity() {
  const { profile, stats } = useProfile();
  const theme = useUIStore(s => s.theme);
  const isDark = theme === 'dark';

  // Derive stats for display
  const totalXp = profile?.total_xp_alltime ?? profile?.current_xp ?? 0;
  const currentLevel = profile?.current_level ?? 1;
  const xpPercent = Math.min(100, ((profile?.current_xp ?? 0) / (currentLevel * 100)) * 100);
  const streakDays = profile?.streak_days ?? 0;
  const auraLevel = profile?.aura_level ?? 100;

  // Build capability list from real stats
  const STAT_ICONS: Record<string, any> = {
    strength: Zap,
    discipline: Gauge,
    intelligence: Cpu,
    creativity: Atom,
    focus: Activity,
    endurance: TrendingUp,
    charisma: GitBranch,
    stoicism: Layers,
    wealth: Sigma,
    consistency: FlaskConical,
  };

  const capabilities = stats.slice(0, 5).map(s => ({
    icon: STAT_ICONS[s.stat_name] ?? Zap,
    name: s.stat_name.charAt(0).toUpperCase() + s.stat_name.slice(1),
    level: s.level,
    progress: Math.min(100, (s.xp / (s.level * 100)) * 100),
    tag: s.level >= 5 ? 'ELITE' : s.level >= 3 ? 'ADEPT' : 'INIT',
  }));

  const logEntries = [
    { timestamp: '00:00:01', event: 'GRAVITATIONAL_OVERRIDE — Module Initialized', status: 'NOMINAL' as const },
    { timestamp: '00:00:02', event: 'FLOATING_LAYER_STACK — Depth engine active', status: 'ACTIVE' as const },
    { timestamp: '00:00:03', event: 'PARTICLE_FIELD — 30 vectors upward drift', status: 'ACTIVE' as const },
    { timestamp: '00:00:04', event: 'TILT_PARALLAX — Per-card mouse tracking', status: 'NOMINAL' as const },
    { timestamp: '00:00:05', event: 'BOSS_PROTOCOL_IV — Awaiting unlock', status: 'LOCKED' as const },
  ];

  return (
    <div className="ag-module">
      {/* Dot grid background */}
      <div className="ag-dot-grid" aria-hidden="true" />

      {/* Particles */}
      <ParticleCanvas dark={isDark} />

      {/* Content layer (above canvas) */}
      <div className="ag-content">

        {/* ── MODULE HEADER ── */}
        <motion.div
          className="ag-header module-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <h1 className="ag-title font-display text-4xl md:text-5xl font-black uppercase tracking-widest text-white glow-text">
              Anti<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">gravity</span>
            </h1>
            <p className="ag-subtitle font-mono text-xs text-white/40 tracking-widest uppercase mt-0.5">// GRAVITATIONAL OVERRIDE ACTIVE</p>
          </div>
          <div className="ag-header-badge font-mono text-xs font-bold tracking-widest px-4 py-2 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-[0_0_15px_rgba(167,139,250,0.25)]">
            <span className="ag-pulse-dot bg-cyan-400" />
            ZERO-G MODE
          </div>
        </motion.div>

        {/* ── PRIMARY GRID ── */}
        <div className="ag-grid">

          {/* LEFT — Orb + mini stats */}
          <div className="ag-orb-panel">
            <AgCard delay={0.08} badge="CORE METRIC">
              <div className="ag-orb-section">
                <OrbStat
                  percent={xpPercent}
                  value={`${Math.round(xpPercent)}%`}
                  label="XP LOAD"
                />
                <div className="ag-mini-stats-grid">
                  <MiniStat value={`LVL ${currentLevel}`} label="TIER" icon={Layers} />
                  <MiniStat value={`${streakDays}D`} label="STREAK" icon={TrendingUp} />
                  <MiniStat value={`${auraLevel}`} label="AURA" icon={Atom} />
                </div>
              </div>
            </AgCard>

            {/* Total XP stat card */}
            <AgCard delay={0.16} badge="CUMULATIVE">
              <div className="ag-xp-card">
                <Zap className="ag-xp-icon" />
                <div>
                  <span className="ag-xp-value">{totalXp.toLocaleString()}</span>
                  <span className="ag-xp-label">TOTAL XP ABSORBED</span>
                </div>
              </div>
            </AgCard>
          </div>

          {/* RIGHT — Capabilities + Log */}
          <div className="ag-detail-panel">

            {/* Capability stack */}
            <AgCard delay={0.12} badge="PROTOCOL STACK" className="ag-card--tall">
              <h2 className="ag-card-title">
                <Cpu className="ag-card-title-icon" />
                Active Protocols
              </h2>
              <div className="ag-cap-list">
                {capabilities.length > 0 ? (
                  capabilities.map((c) => (
                    <CapabilityRow key={c.name} {...c} />
                  ))
                ) : (
                  <div className="ag-empty-state">
                    <Activity className="ag-empty-icon" />
                    <span>No protocols initialized — begin training to activate.</span>
                  </div>
                )}
              </div>
            </AgCard>

            {/* Event log */}
            <AgCard delay={0.2} badge="SYSTEM LOG">
              <h2 className="ag-card-title">
                <GitBranch className="ag-card-title-icon" />
                Event Telemetry
              </h2>
              <div className="ag-log-list">
                {logEntries.map((entry, i) => (
                  <LogEntry key={i} {...entry} delay={0.3 + i * 0.07} />
                ))}
              </div>
            </AgCard>
          </div>
        </div>

        {/* ── BOTTOM FULL-WIDTH STAT STRIP ── */}
        <motion.div
          className="ag-stat-strip"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {[
            { icon: Zap, value: `${totalXp}`, label: 'XP TOTAL' },
            { icon: Layers, value: `${currentLevel}`, label: 'CURRENT LEVEL' },
            { icon: TrendingUp, value: `${streakDays}d`, label: 'ACTIVE STREAK' },
            { icon: Atom, value: `${auraLevel}`, label: 'AURA SCORE' },
            { icon: Gauge, value: stats.length, label: 'PROTOCOLS' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="ag-strip-item">
              <Icon className="ag-strip-icon" />
              <span className="ag-strip-value">{value}</span>
              <span className="ag-strip-label">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
