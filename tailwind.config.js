/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#080B12',          // deepest background
        abyss: '#0D1117',         // main background
        surface: '#111827',       // card background
        glass: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        'border-bright': 'rgba(255,255,255,0.15)',
        
        monarch: '#7C3AED',       // primary purple (power)
        'monarch-glow': '#A78BFA',  // lighter purple for glows
        'monarch-dim': '#4C1D95',   // dark purple for fills
        
        gold: '#F59E0B',          // XP / achievement accent
        'gold-glow': '#FDE68A',     // light gold
        
        cyan: '#06B6D4',          // stat accent
        'cyan-glow': '#67E8F9',     // glow variant
        
        danger: '#EF4444',
        success: '#10B981',
        
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
        
        'accent-blue': '#06B6D4',
        'accent-purple': '#7C3AED',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],    // headings, stat numbers, level badges
        body: ['Inter', 'sans-serif'],          // body text
        mono: ['"JetBrains Mono"', 'monospace'], // data, percentages
        
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        'share-tech-mono': ['"Share Tech Mono"', 'monospace'],
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        'archivo-narrow': ['"Archivo Narrow"', 'sans-serif'],
        'space-mono': ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        glass: '16px',
        card: '12px',
        pill: '999px',
      },
      boxShadow: {
        'neon-blue': '0 0 5px rgba(6,182,212,0.4), 0 0 10px rgba(6,182,212,0.2)',
        'neon-purple': '0 0 5px rgba(124,58,237,0.4), 0 0 10px rgba(124,58,237,0.2)',
        'neon-red': '0 0 5px rgba(239,68,68,0.4), 0 0 10px rgba(239,68,68,0.2)',
      }
    },
  },
  plugins: [],
}
