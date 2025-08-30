import { create } from 'zustand';
import { produce } from 'immer';
import type { TileMap } from '../types/index';

function createDefaultLayer(width: number, height: number) {
  return {
    id: 'main-layer',
    name: 'Main Layer',
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
  setMapSize: (width: number, height: number) => void;
  placeTile: (x: number, y: number, tileId: string) => void;
  undo: () => void;
  redo: () => void;
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
  setMapSize: (width, height) => {
    set(state => {
      const next = produce(state.tileMap, draft => {
        draft.width = width;
        draft.height = height;
        draft.layers[0].data = resizeLayerData(draft.layers[0].data, width, height);
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
        draft.layers[0].data[y][x] = tileId;
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
}));
