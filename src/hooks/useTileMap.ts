import { useState, useCallback } from 'react';
import type { TileMap } from '../types/index';

function createDefaultLayer(width: number, height: number) {
  return {
    id: 'layer-1',
    name: 'Layer 1',
    visible: true,
    opacity: 1,
    data: Array.from({ length: height }, () => Array(width).fill(null)),
  };
}

export function useTileMap() {
  const [tileMap, setTileMap] = useState<TileMap>({
    width: 20,
    height: 15,
    tileSize: 32,
    layers: [createDefaultLayer(20, 15)],
  });
  const [activeLayerId, setActiveLayerId] = useState('layer-1');

  const placeTile = useCallback((x: number, y: number, tileId: number) => {
    setTileMap(prev => {
      const layers = prev.layers.map(layer => {
        if (layer.id !== activeLayerId) return layer;
        const data = layer.data.map(row => [...row]);
        data[y][x] = tileId;
        return { ...layer, data };
      });
      return { ...prev, layers };
    });
  }, [activeLayerId]);

  return { tileMap, setTileMap, activeLayerId, setActiveLayerId, placeTile };
}
