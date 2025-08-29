import { create } from 'zustand';
import type { TileMap, Layer } from '../types/index';

function createDefaultLayer(width: number, height: number): Layer {
  return {
    id: 'layer-1',
    name: 'Layer 1',
    visible: true,
    opacity: 1,
    data: Array.from({ length: height }, () => Array(width).fill(null)),
  };
}

function resizeLayerData(data: any[][], newWidth: number, newHeight: number) {
  const resized = [];
  for (let y = 0; y < newHeight; y++) {
    const row = [];
    for (let x = 0; x < newWidth; x++) {
      row.push(data[y]?.[x] ?? null);
    }
    resized.push(row);
  }
  return resized;
}

interface TileMapState {
  tileMap: TileMap;
  setMapSize: (width: number, height: number) => void;
  placeTile: (x: number, y: number, tileId: number) => void;
}

export const useTileMapStore = create<TileMapState>((set, get) => ({
  tileMap: {
    width: 20,
    height: 15,
    tileSize: 32,
    layers: [createDefaultLayer(20, 15)],
  },
  setMapSize: (width, height) => {
    set(state => ({
      tileMap: {
        ...state.tileMap,
        width,
        height,
        layers: state.tileMap.layers.map(layer => ({
          ...layer,
          data: resizeLayerData(layer.data, width, height),
        })),
      },
    }));
  },
  placeTile: (x, y, tileId) => {
    set(state => ({
      tileMap: {
        ...state.tileMap,
        layers: state.tileMap.layers.map(layer => {
          const data = layer.data.map(row => [...row]);
          data[y][x] = tileId;
          return { ...layer, data };
        }),
      },
    }));
  },
}));
