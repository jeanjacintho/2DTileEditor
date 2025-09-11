import { memo, useMemo } from 'react';
import type { Layer } from '../../types/index';

interface LayerRendererProps {
  layer: Layer;
  layerIndex: number;
  totalLayers: number;
  GRID_TILE_SIZE: number;
  renderTile: (cell: string | null) => React.ReactNode;
}

// Componente individual de tile memoizado para evitar re-renders desnecessários
const TileElement = memo(({ 
  x, 
  y, 
  cell, 
  GRID_TILE_SIZE, 
  renderTile 
}: { 
  x: number; 
  y: number; 
  cell: string; 
  GRID_TILE_SIZE: number; 
  renderTile: (cell: string | null) => React.ReactNode; 
}) => (
  <div
    style={{
      position: 'absolute',
      left: x * GRID_TILE_SIZE,
      top: y * GRID_TILE_SIZE,
      willChange: 'transform', // Otimização para GPU
    }}
  >
    {renderTile(cell)}
  </div>
));

TileElement.displayName = 'TileElement';

const LayerRenderer = memo(({ 
  layer, 
  layerIndex, 
  totalLayers, 
  GRID_TILE_SIZE, 
  renderTile 
}: LayerRendererProps) => {
  // Otimização: Memoizar apenas os tiles não-nulos com coordenadas
  const tilesToRender = useMemo(() => {
    const tiles: Array<{ x: number; y: number; cell: string; key: string }> = [];
    
    layer.data.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== null) {
          tiles.push({ 
            x, 
            y, 
            cell, 
            key: `${layer.id}-${x}-${y}` // Key otimizada para React
          });
        }
      });
    });
    
    return tiles;
  }, [layer.data, layer.id]);

  // Memoizar o estilo do container para evitar recálculos
  const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    opacity: layer.opacity,
    zIndex: totalLayers - layerIndex,
    pointerEvents: 'none' as const,
    willChange: 'transform', // Otimização para GPU
  }), [layer.opacity, totalLayers, layerIndex]);

  return (
    <div style={containerStyle}>
      {tilesToRender.map(({ x, y, cell, key }) => (
        <TileElement
          key={key}
          x={x}
          y={y}
          cell={cell}
          GRID_TILE_SIZE={GRID_TILE_SIZE}
          renderTile={renderTile}
        />
      ))}
    </div>
  );
});

LayerRenderer.displayName = 'LayerRenderer';

export default LayerRenderer;
