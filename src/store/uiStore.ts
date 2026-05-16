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
}

export const useUIStore = create<UIState>((set) => ({
  particles: [],
  isLevelUp: false,
  addXpParticle: (x, y, amount) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ particles: [...state.particles, { id, x, y, amount }] }));
  },
  removeParticle: (id) =>
    set((state) => ({ particles: state.particles.filter((p) => p.id !== id) })),
  triggerLevelUp: () => set({ isLevelUp: true }),
  closeLevelUp: () => set({ isLevelUp: false }),
}));
