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
  exportMap: (tileSize: number) => void;
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
        draft.layers.unshift(newLayer); // Add to beginning (top) - visualmente em cima
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
        draft.layers.unshift(duplicatedLayer); // Add to beginning (top) - visualmente em cima
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
  exportMap: (tileSize) => {
    set(state => {
      // Converter o formato de dados para o formato especificado
      // Ordem: primeiro layer primeiro (Layer_0, Layer_1, Layer_2, etc.)
      // Como as layers estão em ordem reversa no array (mais nova primeiro), precisamos reverter para exportar na ordem cronológica
      const layers = [...state.tileMap.layers].reverse().map(layer => {
        const tiles: Array<{id: string, x: number, y: number}> = [];
        
        // Converter a matriz de dados para lista de tiles
        for (let y = 0; y < layer.data.length; y++) {
          for (let x = 0; x < layer.data[y].length; x++) {
            const tileId = layer.data[y][x];
            if (tileId !== null) {
              tiles.push({
                id: tileId,
                x: x,
                y: y
              });
            }
          }
        }
        
        return {
          name: layer.name,
          tiles: tiles,
          collider: layer.isCollision
        };
      });
      
      const mapData = {
        tileSize: tileSize,
        mapWidth: state.tileMap.width,
        mapHeight: state.tileMap.height,
        layers: layers
      };
      
      // Exportar map.json
      const mapBlob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
      const mapUrl = URL.createObjectURL(mapBlob);
      const mapLink = document.createElement('a');
      mapLink.href = mapUrl;
      mapLink.download = 'map.json';
      document.body.appendChild(mapLink);
      mapLink.click();
      document.body.removeChild(mapLink);
      URL.revokeObjectURL(mapUrl);
      
      // Gerar tiles.json baseado nos tiles usados no mapa
      const usedTileIds = new Set<string>();
      state.tileMap.layers.forEach(layer => {
        layer.data.forEach(row => {
          row.forEach(tileId => {
            if (tileId !== null) {
              usedTileIds.add(tileId);
            }
          });
        });
      });
      
      const tilesData = {
        tileSize: tileSize,
        spritesheet: "",
        tiles: Array.from(usedTileIds).map(tileId => {
          // Extrair coordenadas x, y do tileId (formato: "x_y")
          const [x, y] = tileId.split('_').map(Number);
          return {
            id: tileId, // Manter o ID como string (igual ao referenciado no mapa)
            x: x,
            y: y,
            collision: false // Sempre false pois collision é definido no mapa
          };
        }).sort((a, b) => a.id.localeCompare(b.id)) // Ordenar por ID string
      };
      
      // Exportar tiles.json
      const tilesBlob = new Blob([JSON.stringify(tilesData, null, 2)], { type: 'application/json' });
      const tilesUrl = URL.createObjectURL(tilesBlob);
      const tilesLink = document.createElement('a');
      tilesLink.href = tilesUrl;
      tilesLink.download = 'tiles.json';
      document.body.appendChild(tilesLink);
      tilesLink.click();
      document.body.removeChild(tilesLink);
      URL.revokeObjectURL(tilesUrl);
      
      return state;
    });
  },
}));
