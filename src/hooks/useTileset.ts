import { create } from 'zustand';
import type { Tile } from '../types/index';

interface TilesetState {
  tileset: HTMLImageElement | null;
  tiles: Tile[];
  tileSize: { width: number; height: number };
  activeTile: string | null;
  setTileset: (img: HTMLImageElement | null) => void;
  setTiles: (tiles: Tile[]) => void;
  setTileSize: (size: { width: number; height: number }) => void;
  setActiveTile: (id: string | null) => void;
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = tileSize.width;
    canvas.height = tileSize.height;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.clearRect(0, 0, tileSize.width, tileSize.height);
        ctx.drawImage(
          tileset,
          x * tileSize.width,
          y * tileSize.height,
          tileSize.width,
          tileSize.height,
          0,
          0,
          tileSize.width,
          tileSize.height
        );
        const imageData = ctx.getImageData(0, 0, tileSize.width, tileSize.height);
        const data = imageData.data;
        let visible = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) {
            visible = true;
            break;
          }
        }
        if (visible) {
          newTiles.push({
            id: `${x}_${y}`,
            x: x * tileSize.width,
            y: y * tileSize.height,
            width: tileSize.width,
            height: tileSize.height,
          });
        }
      }
    }
    setTiles(newTiles);
  },
}));
