import { create } from 'zustand';

type DrawMode = 'normal' | 'rectangular';

interface DrawModeState {
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  toggleDrawMode: () => void;
}

export const useDrawModeStore = create<DrawModeState>((set) => ({
  drawMode: 'normal',
  setDrawMode: (mode) => set({ drawMode: mode }),
  toggleDrawMode: () => set((state) => ({ 
    drawMode: state.drawMode === 'normal' ? 'rectangular' : 'normal' 
  })),
}));
