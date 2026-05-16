import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  setOffline: (status: boolean) => void;
  // We will add more state as we build the phases
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: !navigator.onLine,
  setOffline: (status) => set({ isOffline: status }),
}));
