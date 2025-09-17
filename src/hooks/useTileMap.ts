import { create } from 'zustand';
import { produce } from 'immer';
import type { TileMap, Layer } from '../types/index';
import { useTilesetStore } from './useTileset';

function createDefaultLayer(): Layer {
  return {
    id: Date.now().toString(),
    name: "Layer_0",
    visible: true,
    opacity: 1,
    isCollision: false,
    data: [], // Inicialmente vazio, será expandido dinamicamente
  };
}

interface TileMapState {
  tileMap: TileMap;
  history: TileMap[];
  future: TileMap[];
  activeLayerId: string | null;
  placeTile: (x: number, y: number, tileId: string) => void;
  removeTile: (x: number, y: number) => void;
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
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  exportMap: (tileSize: number) => void;
  importMap: (files: { mapFile: File; tilesFile?: File }) => Promise<void>;
  centerViewportOnMap: () => void;
  getMapBounds: () => { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

export const useTileMapStore = create<TileMapState>((set, get) => ({
  tileMap: {
    width: 0, // Será calculado dinamicamente
    height: 0, // Será calculado dinamicamente
    tileSize: 32,
    layers: [createDefaultLayer()],
  },
  history: [],
  future: [],
  activeLayerId: null,
  placeTile: (x, y, tileId) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const activeLayer = draft.layers.find(layer => layer.id === state.activeLayerId);
        if (activeLayer && activeLayer.visible) {
          // Garantir que a matriz tenha espaço suficiente
          while (activeLayer.data.length <= y) {
            activeLayer.data.push([]);
          }
          while (activeLayer.data[y].length <= x) {
            activeLayer.data[y].push(null);
          }
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
  removeTile: (x, y) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        const activeLayer = draft.layers.find(layer => layer.id === state.activeLayerId);
        if (activeLayer && activeLayer.visible && activeLayer.data[y] && activeLayer.data[y][x] !== null) {
          activeLayer.data[y][x] = null;
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
        data: [], // Inicialmente vazio
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
  reorderLayers: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    set(state => {
      const layers = [...state.tileMap.layers];
      const [movedLayer] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, movedLayer);
      
      const next = produce(state.tileMap, draft => {
        draft.layers = layers;
      });
      
      return {
        tileMap: next,
        history: [...state.history, state.tileMap],
        future: [],
      };
    });
  },
  getMapBounds: () => {
    const state = get();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasTiles = false;
    
    state.tileMap.layers.forEach(layer => {
      if (!layer.visible) return; // Pular layers invisíveis
      
      layer.data.forEach((row, y) => {
        row.forEach((tileId, x) => {
          if (tileId !== null) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            hasTiles = true;
          }
        });
      });
    });
    
    // Se não há tiles, retornar valores padrão centralizados
    if (!hasTiles) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 1, height: 1 };
    }
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  },
  exportMap: (tileSize) => {
    set(state => {
      const bounds = get().getMapBounds();
      
      // Converter o formato de dados para o formato especificado
      // Inverter a ordem das layers para que a ordem de exportação reflita a ordem visual
      // (base para topo, já que visualmente a base é renderizada por último)
      const layers = state.tileMap.layers.slice().reverse().map(layer => {
        const tiles: Array<{id: string, x: number, y: number}> = [];
        
        // Converter a matriz de dados para lista de tiles, ajustando para coordenadas relativas
        layer.data.forEach((row, y) => {
          row.forEach((tileId, x) => {
            if (tileId !== null) {
              tiles.push({
                id: tileId,
                x: x - bounds.minX, // Coordenada relativa ao bounds
                y: y - bounds.minY   // Coordenada relativa ao bounds
              });
            }
          });
        });
        
        return {
          name: layer.name,
          tiles: tiles,
          collider: layer.isCollision
        };
      });
      
      const mapData = {
        tileSize: tileSize,
        mapWidth: bounds.width,
        mapHeight: bounds.height,
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
  importMap: async (files: { mapFile: File; tilesFile?: File }) => {
    try {
      const mapText = await files.mapFile.text();
      const mapData = JSON.parse(mapText);
      
      // Processar tiles.json se fornecido
      let tilesData: any = null;
      if (files.tilesFile) {
        try {
          const tilesText = await files.tilesFile.text();
          tilesData = JSON.parse(tilesText);
        } catch (error) {
          console.warn('Erro ao processar tiles.json:', error);
        }
      }
      
      // Validar estrutura básica do arquivo
      if (!mapData.layers || !Array.isArray(mapData.layers)) {
        throw new Error('Formato de arquivo inválido: layers não encontradas');
      }
      
      // IMPORTANTE: Usar a ordem das layers como estão no arquivo
      // (sem inverter, já que agora o usuário pode reordenar)
      const layers = mapData.layers;
      
      // Calcular bounds globais primeiro (como na exportação)
      let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;
      
      layers.forEach(layerData => {
        if (layerData.tiles && Array.isArray(layerData.tiles)) {
          layerData.tiles.forEach((tile: any) => {
            if (typeof tile.x === 'number' && typeof tile.y === 'number') {
              globalMinX = Math.min(globalMinX, tile.x);
              globalMinY = Math.min(globalMinY, tile.y);
              globalMaxX = Math.max(globalMaxX, tile.x);
              globalMaxY = Math.max(globalMaxY, tile.y);
            }
          });
        }
      });
      
      // Se não há tiles, usar valores padrão
      if (globalMinX === Infinity) {
        globalMinX = globalMinY = globalMaxX = globalMaxY = 0;
      }
      
      const globalWidth = globalMaxX - globalMinX + 1;
      const globalHeight = globalMaxY - globalMinY + 1;
      
      // Criar layers com matrizes do tamanho global
      const newLayers: Layer[] = layers.map((layerData: any, index: number) => {
        if (!layerData.tiles || !Array.isArray(layerData.tiles)) {
          throw new Error(`Layer ${index}: formato de tiles inválido`);
        }
        
        // Se não há tiles, criar layer vazia com tamanho global
        if (layerData.tiles.length === 0) {
          return {
            id: `layer_${Date.now()}_${index}`,
            name: layerData.name || `Layer ${index}`,
            visible: true,
            opacity: 1,
            isCollision: Boolean(layerData.collider), // Garantir que seja boolean
            data: Array(globalHeight).fill(null).map(() => Array(globalWidth).fill(null))
          };
        }
        
        // Criar matriz com dimensões globais
        const data: (string | null)[][] = Array(globalHeight).fill(null).map(() => Array(globalWidth).fill(null));
        
        // Preencher a matriz com os tiles usando coordenadas globais
        layerData.tiles.forEach((tile: any) => {
          if (typeof tile.x === 'number' && typeof tile.y === 'number' && tile.id) {
            const x = tile.x - globalMinX;
            const y = tile.y - globalMinY;
            
            // Verificar se as coordenadas estão dentro dos bounds
            if (x >= 0 && x < globalWidth && y >= 0 && y < globalHeight) {
              data[y][x] = tile.id;
            }
          }
        });
        
        return {
          id: `layer_${Date.now()}_${index}`,
          name: layerData.name || `Layer ${index}`,
          visible: true,
          opacity: 1,
          isCollision: Boolean(layerData.collider), // Garantir que seja boolean
          data: data
        };
      });
      
      const newTileMap: TileMap = {
        width: globalWidth,
        height: globalHeight,
        tileSize: mapData.tileSize || 32,
        layers: newLayers
      };
      
      // Atualizar estado
      set(state => ({
        ...state,
        tileMap: newTileMap,
        activeLayerId: newLayers.length > 0 ? newLayers[0].id : null,
        history: [...state.history, state.tileMap], // Salvar estado anterior no histórico
        future: [] // Limpar futuro ao importar
      }));
      
      // Atualizar o tileSize no tileset store
      const tileSizeFromMap = mapData.tileSize || 32;
      useTilesetStore.getState().setTileSize({ 
        width: tileSizeFromMap, 
        height: tileSizeFromMap 
      });
      
      // Processar tiles.json se fornecido
      if (tilesData && tilesData.tiles && Array.isArray(tilesData.tiles)) {
        console.log(`Processando ${tilesData.tiles.length} tiles do tiles.json`);
        
        // Aqui você pode adicionar lógica para processar os tiles
        // Por exemplo, criar um tileset virtual ou carregar uma imagem
        // Por enquanto, apenas logamos as informações
        tilesData.tiles.forEach((tile: any, index: number) => {
          if (index < 5) { // Log apenas os primeiros 5 para não poluir o console
            console.log(`Tile ${tile.id}: posição (${tile.x}, ${tile.y}), collision: ${tile.collision}`);
          }
        });
      }
      
      console.log(`Mapa importado com sucesso: ${newLayers.length} layers (ordem corrigida), ${tileSizeFromMap}px tiles`);
      
      // Centralizar viewport no mapa importado após um pequeno delay
      setTimeout(() => {
        get().centerViewportOnMap();
      }, 100);
      
    } catch (error) {
      console.error('Erro ao importar mapa:', error);
      throw new Error(`Erro ao importar mapa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  },
  centerViewportOnMap: () => {
    // Disparar evento customizado para que o CanvasEditor possa centralizar o viewport
    const event = new CustomEvent('centerViewportOnMap');
    window.dispatchEvent(event);
  },
}));
