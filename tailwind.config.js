/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',          // deepest background
        abyss: 'var(--color-abyss)',         // main background
        surface: 'var(--color-surface)',       // card background
        glass: 'var(--color-glass)',
        border: 'var(--color-border)',
        'border-bright': 'var(--color-border-bright)',
        
        monarch: 'var(--color-monarch)',       // primary purple (power)
        'monarch-glow': 'var(--color-monarch-glow)',  // lighter purple for glows
        'monarch-dim': 'var(--color-monarch-dim)',   // dark purple for fills
        
        gold: 'var(--color-gold)',          // XP / achievement accent
        'gold-glow': 'var(--color-gold-glow)',     // light gold
        
        cyan: 'var(--color-cyan)',          // stat accent
        'cyan-glow': 'var(--color-cyan-glow)',     // glow variant
        
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        
        'accent-blue': 'var(--color-accent-blue)',
        'accent-purple': 'var(--color-accent-purple)',
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
