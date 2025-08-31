import { useState, useEffect, useRef, useMemo } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const tileSize = useTilesetStore(s => s.tileSize);
  
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Tamanho fixo do grid (como estava antes)
  const GRID_TILE_SIZE = 32;

  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport({
          width: rect.width,
          height: rect.height
        });
      }
    };

    const handleScroll = () => {
      if (containerRef.current) {
        setScrollPosition({
          x: containerRef.current.scrollLeft,
          y: containerRef.current.scrollTop
        });
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleCellClick = (x: number, y: number) => {
    if (activeTile) {
      placeTile(x, y, activeTile);
    }
  };

  // Calcular células visíveis baseadas no viewport e scroll
  const visibleCells = useMemo(() => {
    const startX = Math.floor(scrollPosition.x / GRID_TILE_SIZE);
    const startY = Math.floor(scrollPosition.y / GRID_TILE_SIZE);
    const visibleCols = Math.ceil(viewport.width / GRID_TILE_SIZE) + 4; // Buffer extra
    const visibleRows = Math.ceil(viewport.height / GRID_TILE_SIZE) + 4; // Buffer extra

    const cells = [];
    for (let y = startY; y < startY + visibleRows; y++) {
      for (let x = startX; x < startX + visibleCols; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, [scrollPosition.x, scrollPosition.y, viewport.width, viewport.height]);

  function renderTile(cell: string | null) {
    if (!cell || !tileset) return null;
    
    // Extrair coordenadas x, y do tileId (formato: "x_y")
    const [tileX, tileY] = cell.split('_').map(Number);
    
    // Calcular escala para ajustar o tile ao grid
    const scaleX = GRID_TILE_SIZE / tileSize.width;
    const scaleY = GRID_TILE_SIZE / tileSize.height;
    
    return (
      <div
        key={`${tileX}_${tileY}`}
        style={{
          width: GRID_TILE_SIZE,
          height: GRID_TILE_SIZE,
          backgroundImage: `url(${tileset.src})`,
          backgroundPosition: `-${tileX * tileSize.width * scaleX}px -${tileY * tileSize.height * scaleY}px`,
          backgroundSize: `${tileset.width * scaleX}px ${tileset.height * scaleY}px`,
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  return (
    <main className="flex-1 bg-white overflow-hidden relative">
      {/* Container para tiles com scroll */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-auto"
      >
        <div 
          style={{ 
            position: 'relative',
            width: '100000px', // Grid realmente infinito
            height: '100000px',
            padding: '50px'
          }}
        >
          {/* Grid infinito de fundo - move com o scroll */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_TILE_SIZE}px ${GRID_TILE_SIZE}px`,
              backgroundPosition: '0 0'
            }}
          />

          {/* Renderizar layers */}
          {tileMap.layers.map((layer, layerIndex) => (
            layer.visible && (
              <div 
                key={layer.id} 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: layer.opacity,
                  zIndex: tileMap.layers.length - layerIndex,
                  pointerEvents: 'none'
                }}
              >
                {layer.data.map((row, y) => 
                  row.map((cell, x) => 
                    cell && (
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
                    )
                  )
                )}
              </div>
            )
          ))}

          {/* Grid clicável infinito - apenas células visíveis */}
          <div 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1000,
              pointerEvents: 'auto',
              width: '100%',
              height: '100%'
            }}
          >
            {visibleCells.map(({ x, y }) => (
              <div
                key={`grid-${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: x * GRID_TILE_SIZE,
                  top: y * GRID_TILE_SIZE,
                  width: GRID_TILE_SIZE,
                  height: GRID_TILE_SIZE,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={(e) => {
                  if (activeTile) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,255,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
