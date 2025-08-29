import { create } from 'zustand';
import type { Tile } from '../types/index';

interface TilesetState {
  tileset: HTMLImageElement | null;
  tiles: Tile[];
  tileSize: { width: number; height: number };
  activeTile: number | null;
  setTileset: (img: HTMLImageElement | null) => void;
  setTiles: (tiles: Tile[]) => void;
  setTileSize: (size: { width: number; height: number }) => void;
  setActiveTile: (id: number | null) => void;
  loadTileset: (file: File) => void;
  extractTiles: () => void;
}

export const useTilesetStore = create<TilesetState>((set, get) => ({
  tileset: null,
  tiles: [],
  tileSize: { width: 32, height: 32 },
  activeTile: null,
  setTileset: tileset => set({ tileset }),
  setTiles: tiles => set({ tiles }),
  setTileSize: tileSize => set({ tileSize }),
  setActiveTile: activeTile => set({ activeTile }),
  loadTileset: (file: File) => {
    const img = new window.Image();
    img.onload = () => set({ tileset: img });
    img.src = URL.createObjectURL(file);
  },
  extractTiles: () => {
    const { tileset, tileSize, setTiles } = get();
    if (!tileset) return;
    const cols = Math.floor(tileset.width / tileSize.width);
    const rows = Math.floor(tileset.height / tileSize.height);
    const newTiles: Tile[] = [];
    let id = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        newTiles.push({
          id: id++,
          x: x * tileSize.width,
          y: y * tileSize.height,
          width: tileSize.width,
          height: tileSize.height,
        });
      }
    }
    setTiles(newTiles);
  },
}));
