import { create } from 'zustand';

interface TilesetState {
  tileset: HTMLImageElement | null;
  tileSize: { width: number; height: number };
  activeTile: string | null;
  setTileset: (img: HTMLImageElement | null) => void;
  setTileSize: (size: { width: number; height: number }) => void;
  setActiveTile: (id: string | null) => void;
  loadTileset: (file: File) => void;
  selectTileFromGrid: (x: number, y: number) => void;
}

export const useTilesetStore = create<TilesetState>((set) => ({
  tileset: null,
  tileSize: { width: 32, height: 32 }, // Tamanho fixo padrão
  activeTile: null,
  setTileset: tileset => set({ tileset }),
  setTileSize: tileSize => set({ tileSize }),
  setActiveTile: activeTile => set({ activeTile }),
  loadTileset: (file: File) => {
    const img = new window.Image();
    img.onload = () => {
      set({ tileset: img });
    };
    img.src = URL.createObjectURL(file);
  },
  selectTileFromGrid: (x: number, y: number) => {
    const tileId = `${x}_${y}`;
    set({ activeTile: tileId });
  },
}));
