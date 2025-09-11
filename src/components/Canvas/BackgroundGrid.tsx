import { memo, useMemo } from 'react';

interface BackgroundGridProps {
  visibleCells: Array<{ x: number; y: number }>;
  GRID_TILE_SIZE: number;
}

// Componente individual de célula do grid memoizado
const GridCell = memo(({ 
  x, 
  y, 
  GRID_TILE_SIZE 
}: { 
  x: number; 
  y: number; 
  GRID_TILE_SIZE: number; 
}) => (
  <div
    style={{
      position: 'absolute',
      left: x * GRID_TILE_SIZE,
      top: y * GRID_TILE_SIZE,
      width: GRID_TILE_SIZE,
      height: GRID_TILE_SIZE,
      border: '1px solid rgba(255,255,255,0.15)',
      backgroundColor: 'transparent',
      willChange: 'transform', // Otimização para GPU
    }}
  />
));

GridCell.displayName = 'GridCell';

const BackgroundGrid = memo(({ visibleCells, GRID_TILE_SIZE }: BackgroundGridProps) => {
  // Memoizar o estilo do container
  const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    zIndex: 1,
    pointerEvents: 'none' as const,
    width: '100%',
    height: '100%',
    willChange: 'transform', // Otimização para GPU
  }), []);

  return (
    <div style={containerStyle}>
      {visibleCells.map(({ x, y }) => (
        <GridCell
          key={`bg-grid-${x}-${y}`}
          x={x}
          y={y}
          GRID_TILE_SIZE={GRID_TILE_SIZE}
        />
      ))}
    </div>
  );
});

BackgroundGrid.displayName = 'BackgroundGrid';

export default BackgroundGrid;
