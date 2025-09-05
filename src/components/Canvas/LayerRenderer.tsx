import { memo, useMemo } from 'react';
import type { Layer } from '../../types/index';

interface LayerRendererProps {
  layer: Layer;
  layerIndex: number;
  totalLayers: number;
  GRID_TILE_SIZE: number;
  renderTile: (cell: string | null) => React.ReactNode;
}

const LayerRenderer = memo(({ 
  layer, 
  layerIndex, 
  totalLayers, 
  GRID_TILE_SIZE, 
  renderTile 
}: LayerRendererProps) => {
  // Memoizar apenas os tiles não-nulos para evitar renderizar células vazias
  const tilesToRender = useMemo(() => {
    const tiles: Array<{ x: number; y: number; cell: string }> = [];
    
    layer.data.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== null) {
          tiles.push({ x, y, cell });
        }
      });
    });
    
    return tiles;
  }, [layer.data]);

  return (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: layer.opacity,
        zIndex: totalLayers - layerIndex,
        pointerEvents: 'none'
      }}
    >
      {tilesToRender.map(({ x, y, cell }) => (
        <div
          key={`${layer.id}-${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * GRID_TILE_SIZE,
            top: y * GRID_TILE_SIZE,
          }}
        >
          {renderTile(cell)}
        </div>
      ))}
    </div>
  );
});

LayerRenderer.displayName = 'LayerRenderer';

export default LayerRenderer;
