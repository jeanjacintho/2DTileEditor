import { create } from 'zustand';
import { produce } from 'immer';
import type { TileMap, Layer } from '../types/index';

function createDefaultLayer(width: number, height: number): Layer {
  return {
    id: Date.now().toString(),
    name: "Layer_0",
    visible: true,
    opacity: 1,
    isCollision: false,
    data: Array.from({ length: height }, () => Array(width).fill(null)),
  };
}

function resizeLayerData(data: any[][], newWidth: number, newHeight: number) {
  const resized = [];
  for (let y = 0; y < newHeight; y++) {
    const row = [];
    for (let x = 0; x < newWidth; x++) {
      row.push(y < data.length && x < data[y].length ? data[y][x] : null);
    }
    resized.push(row);
  }
  return resized;
}

interface TileMapState {
  tileMap: TileMap;
  history: TileMap[];
  future: TileMap[];
  activeLayerId: string | null;
  setMapSize: (width: number, height: number) => void;
  placeTile: (x: number, y: number, tileId: string) => void;
  undo: () => void;
  redo: () => void;
  // Layer management
  addLayer: () => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  setLayerVisible: (layerId: string, visible: boolean) => void;
  setLayerName: (layerId: string, name: string) => void;
  setActiveLayer: (layerId: string) => void;
  setLayerCollision: (layerId: string, isCollision: boolean) => void;
}

export const useTileMapStore = create<TileMapState>((set) => ({
  tileMap: {
    width: 20,
    height: 15,
    tileSize: 32,
    layers: [createDefaultLayer(20, 15)],
  },
  history: [],
  future: [],
  activeLayerId: null,
  setMapSize: (width, height) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        draft.width = width;
        draft.height = height;
        draft.layers.forEach(layer => {
          layer.data = resizeLayerData(layer.data, width, height);
        });
      });
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  placeTile: (x, y, tileId) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const activeLayer = draft.layers.find(layer => layer.id === state.activeLayerId);
        if (activeLayer && activeLayer.visible) {
          activeLayer.data[y][x] = tileId;
        }
      });
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  undo: () => {
    set(state => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        tileMap: prev,
        history: newHistory,
        future: [state.tileMap, ...state.future],
      };
    });
  },
  redo: () => {
    set(state => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: newFuture,
      };
    });
  },
  // Layer management functions
  addLayer: () => {
    set(state => {
      const newLayer: Layer = {
        id: Date.now().toString(),
        name: `Layer_${state.tileMap.layers.length}`,
        visible: true,
        opacity: 1,
        isCollision: false,
        data: Array.from({ length: state.tileMap.height }, () => Array(state.tileMap.width).fill(null)),
      };
      
      const next = produce(state.tileMap, draft => {
        draft.layers.unshift(newLayer); // Add to beginning instead of end
      });
      
      return {
        tileMap: next,
        activeLayerId: newLayer.id,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  deleteLayer: (layerId) => {
    set(state => {
      if (state.tileMap.layers.length <= 1) return state; // Don't delete the last layer
      
      const next = produce(state.tileMap, draft => {
        draft.layers = draft.layers.filter(layer => layer.id !== layerId);
      });
      
      // Set new active layer if the deleted one was active
      let newActiveLayerId = state.activeLayerId;
      if (state.activeLayerId === layerId) {
        newActiveLayerId = next.layers[0]?.id || null;
      }
      
      return {
        tileMap: next,
        activeLayerId: newActiveLayerId,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  duplicateLayer: (layerId) => {
    set(state => {
      const sourceLayer = state.tileMap.layers.find(layer => layer.id === layerId);
      if (!sourceLayer) return state;
      
      const duplicatedLayer: Layer = {
        id: Date.now().toString(),
        name: `${sourceLayer.name} (Copy)`,
        visible: sourceLayer.visible,
        opacity: sourceLayer.opacity,
        isCollision: sourceLayer.isCollision,
        data: sourceLayer.data.map(row => [...row]), // Deep copy
      };
      
      const next = produce(state.tileMap, draft => {
        draft.layers.unshift(duplicatedLayer);
      });
      
      return {
        tileMap: next,
        activeLayerId: duplicatedLayer.id,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  setLayerVisible: (layerId, visible) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const layer = draft.layers.find(l => l.id === layerId);
        if (layer) {
          layer.visible = visible;
        }
      });
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  setLayerName: (layerId, name) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const layer = draft.layers.find(l => l.id === layerId);
        if (layer) {
          layer.name = name;
        }
      });
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  setActiveLayer: (layerId) => {
    set({ activeLayerId: layerId });
  },
  setLayerCollision: (layerId, isCollision) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const layer = draft.layers.find(l => l.id === layerId);
        if (layer) {
          layer.isCollision = isCollision;
        }
      });
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
}));
