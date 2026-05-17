/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'rgb(var(--color-void) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        'accent-blue': 'rgb(var(--color-accent-blue) / <alpha-value>)',
        'accent-purple': 'rgb(var(--color-accent-purple) / <alpha-value>)',
        'accent-glow': 'rgba(var(--color-accent-blue), 0.15)',
        white: 'rgb(var(--color-white) / <alpha-value>)',
        
        // adding Stitch design colors for completeness
        primary: '#a8e8ff',
        'primary-container': '#00d4ff',
        secondary: '#d1bcff',
        'secondary-container': '#6800ec',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        'share-tech-mono': ['"Share Tech Mono"', 'monospace'],
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        'archivo-narrow': ['"Archivo Narrow"', 'sans-serif'],
        'space-mono': ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'scanline-pattern': 'linear-gradient(to bottom, rgba(var(--color-white) / 0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'neon-blue': '0 0 5px rgba(var(--color-accent-blue), 0.4), 0 0 10px rgba(var(--color-accent-blue), 0.2)',
        'neon-purple': '0 0 5px rgba(var(--color-accent-purple), 0.4), 0 0 10px rgba(var(--color-accent-purple), 0.2)',
        'neon-red': '0 0 5px rgba(255,47,47,0.4), 0 0 10px rgba(255,47,47,0.2)',
      }
    },
  },
  plugins: [],
}
