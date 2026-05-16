/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#030408',
        panel: '#080D1A',
        'accent-blue': '#00D4FF',
        'accent-purple': '#7B2FFF',
        'accent-glow': 'rgba(0,212,255,0.15)',
        
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
        'scanline-pattern': 'linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'neon-blue': '0 0 5px rgba(0,212,255,0.4), 0 0 10px rgba(0,212,255,0.2)',
        'neon-purple': '0 0 5px rgba(123,47,255,0.4), 0 0 10px rgba(123,47,255,0.2)',
        'neon-red': '0 0 5px rgba(255,47,47,0.4), 0 0 10px rgba(255,47,47,0.2)',
      }
    },
  },
  plugins: [],
}
