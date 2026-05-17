import { create } from 'zustand';

interface Particle {
  id: string;
  x: number;
  y: number;
  amount: number;
}

interface UIState {
  particles: Particle[];
  addXpParticle: (x: number, y: number, amount: number) => void;
  removeParticle: (id: string) => void;
  isLevelUp: boolean;
  triggerLevelUp: () => void;
  closeLevelUp: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  particles: [],
  isLevelUp: false,
  theme: (localStorage.getItem('monarchTheme') as 'dark' | 'light') || 'dark',
  addXpParticle: (x, y, amount) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ particles: [...state.particles, { id, x, y, amount }] }));
  },
  removeParticle: (id) =>
    set((state) => ({ particles: state.particles.filter((p) => p.id !== id) })),
  triggerLevelUp: () => set({ isLevelUp: true }),
  closeLevelUp: () => set({ isLevelUp: false }),
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('monarchTheme', nextTheme);
    
    const htmlEl = document.documentElement;
    if (nextTheme === 'light') {
      htmlEl.classList.add('light-mode');
    } else {
      htmlEl.classList.remove('light-mode');
    }
    
    return { theme: nextTheme };
  }),
}));
