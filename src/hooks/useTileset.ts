import { create } from 'zustand';

interface TilesetState {
  tileset: HTMLImageElement | null;
  tileSize: { width: number; height: number };
  activeTile: string | null;
  selectedTiles: string[]; // Array de tiles selecionados
  selectionBounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
  setTileset: (img: HTMLImageElement | null) => void;
  setTileSize: (size: { width: number; height: number }) => void;
  setActiveTile: (id: string | null) => void;
  setSelectedTiles: (tiles: string[]) => void;
  addTileToSelection: (tileId: string) => void;
  removeTileFromSelection: (tileId: string) => void;
  clearSelection: () => void;
  selectTilesInArea: (startX: number, startY: number, endX: number, endY: number) => void;
  loadTileset: (file: File) => void;
  selectTileFromGrid: (x: number, y: number) => void;
}

export const useTilesetStore = create<TilesetState>((set, get) => ({
  tileset: null,
  tileSize: { width: 32, height: 32 }, // Tamanho fixo padrão
  activeTile: null,
  selectedTiles: [],
  selectionBounds: null,
  setTileset: tileset => set({ tileset }),
  setTileSize: tileSize => set({ tileSize }),
  setActiveTile: activeTile => set({ activeTile }),
  setSelectedTiles: selectedTiles => set({ selectedTiles }),
  addTileToSelection: (tileId: string) => {
    set(state => {
      if (!state.selectedTiles.includes(tileId)) {
        const newSelection = [...state.selectedTiles, tileId];
        return { 
          selectedTiles: newSelection,
          activeTile: tileId // Definir como tile ativo também
        };
      }
      return state;
    });
  },
  removeTileFromSelection: (tileId: string) => {
    set(state => ({
      selectedTiles: state.selectedTiles.filter(id => id !== tileId),
      activeTile: state.activeTile === tileId ? null : state.activeTile
    }));
  },
  clearSelection: () => set({ selectedTiles: [], selectionBounds: null }),
  selectTilesInArea: (startX: number, startY: number, endX: number, endY: number) => {
    const state = get();
    if (!state.tileset) return;
    
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    const tilesInArea: string[] = [];
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tileId = `${x}_${y}`;
        tilesInArea.push(tileId);
      }
    }
    
    set({ 
      selectedTiles: tilesInArea,
      selectionBounds: { minX, minY, maxX, maxY },
      activeTile: tilesInArea[0] || null
    });
  },
  loadTileset: (file: File) => {
    const img = new window.Image();
    img.onload = () => {
      set({ tileset: img });
    };
    img.src = URL.createObjectURL(file);
  },
  selectTileFromGrid: (x: number, y: number) => {
    const tileId = `${x}_${y}`;
    set({ activeTile: tileId, selectedTiles: [tileId] });
  },
}));
