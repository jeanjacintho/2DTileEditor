import { memo } from 'react';

interface BackgroundGridProps {
  visibleCells: Array<{ x: number; y: number }>;
  GRID_TILE_SIZE: number;
}

const BackgroundGrid = memo(({ visibleCells, GRID_TILE_SIZE }: BackgroundGridProps) => {
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%',
        height: '100%'
      }}
    >
      {visibleCells.map(({ x, y }) => (
        <div
          key={`bg-grid-${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * GRID_TILE_SIZE,
            top: y * GRID_TILE_SIZE,
            width: GRID_TILE_SIZE,
            height: GRID_TILE_SIZE,
            border: '1px solid rgba(255,255,255,0.15)',
            backgroundColor: 'transparent',
          }}
        />
      ))}
    </div>
  );
});

BackgroundGrid.displayName = 'BackgroundGrid';

export default BackgroundGrid;
