import { useCallback, useMemo } from 'react';
import { useTileMapStore } from './useTileMap';
import { useTilesetStore } from './useTileset';

// Hook otimizado para seletores específicos e memoização avançada
export const useOptimizedTileMap = () => {
  // Seletores específicos para evitar re-renders desnecessários
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const removeTile = useTileMapStore(s => s.removeTile);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const activeLayerId = useTileMapStore(s => s.activeLayerId);
  
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectedTiles = useTilesetStore(s => s.selectedTiles);
  const selectionBounds = useTilesetStore(s => s.selectionBounds);
  const tileSize = useTilesetStore(s => s.tileSize);

  // Memoizar bounds do mapa para evitar recálculos desnecessários
  const mapBounds = useMemo(() => {
    return getMapBounds();
  }, [tileMap.layers, getMapBounds]);

  // Memoizar layer ativa para evitar buscas repetitivas
  const activeLayer = useMemo(() => {
    return tileMap.layers.find(layer => layer.id === activeLayerId);
  }, [tileMap.layers, activeLayerId]);

  // Função otimizada para desenhar múltiplos tiles com batching
  const drawMultipleTilesOptimized = useCallback((startX: number, startY: number) => {
    if (!selectedTiles.length || !selectionBounds) return;
    
    const tilesWidth = selectionBounds.maxX - selectionBounds.minX + 1;
    
    // Batch operations para melhor performance
    const operations: Array<{ x: number; y: number; tileId: string }> = [];
    
    for (let tileIndex = 0; tileIndex < selectedTiles.length; tileIndex++) {
      const tileId = selectedTiles[tileIndex];
      
      const relativeX = tileIndex % tilesWidth;
      const relativeY = Math.floor(tileIndex / tilesWidth);
      
      const canvasX = startX + relativeX;
      const canvasY = startY + relativeY;
      
      operations.push({ x: canvasX, y: canvasY, tileId });
    }
    
    // Executar todas as operações em batch
    operations.forEach(({ x, y, tileId }) => {
      placeTile(x, y, tileId);
    });
  }, [selectedTiles, selectionBounds, placeTile]);

  // Função otimizada para desenhar área retangular
  const drawRectangularAreaOptimized = useCallback((startX: number, startY: number, endX: number, endY: number, tileId: string) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    // Batch operations para melhor performance
    const operations: Array<{ x: number; y: number }> = [];
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        operations.push({ x, y });
      }
    }
    
    // Executar todas as operações em batch
    operations.forEach(({ x, y }) => {
      placeTile(x, y, tileId);
    });
  }, [placeTile]);

  // Função otimizada para remover área retangular
  const removeRectangularAreaOptimized = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    // Batch operations para melhor performance
    const operations: Array<{ x: number; y: number }> = [];
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        operations.push({ x, y });
      }
    }
    
    // Executar todas as operações em batch
    operations.forEach(({ x, y }) => {
      removeTile(x, y);
    });
  }, [removeTile]);

  // Memoizar estatísticas do mapa para debug
  const mapStats = useMemo(() => {
    let totalTiles = 0;
    let totalLayers = tileMap.layers.length;
    let visibleLayers = tileMap.layers.filter(layer => layer.visible).length;
    
    tileMap.layers.forEach(layer => {
      if (layer.visible) {
        layer.data.forEach(row => {
          row.forEach(tileId => {
            if (tileId !== null) {
              totalTiles++;
            }
          });
        });
      }
    });
    
    return {
      totalTiles,
      totalLayers,
      visibleLayers,
      bounds: mapBounds
    };
  }, [tileMap.layers, mapBounds]);

  return {
    // Estado básico
    tileMap,
    activeLayer,
    mapBounds,
    mapStats,
    
    // Tileset
    tileset,
    activeTile,
    selectedTiles,
    selectionBounds,
    tileSize,
    
    // Funções otimizadas
    placeTile,
    removeTile,
    drawMultipleTilesOptimized,
    drawRectangularAreaOptimized,
    removeRectangularAreaOptimized,
  };
};
