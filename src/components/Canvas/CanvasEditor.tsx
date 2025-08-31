import { useState, useEffect, useRef, useMemo } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const removeTile = useTileMapStore(s => s.removeTile);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const tileSize = useTilesetStore(s => s.tileSize);
  
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastDrawnCell, setLastDrawnCell] = useState<{ x: number; y: number } | null>(null);
  const [lastErasedCell, setLastErasedCell] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tamanho base do grid
  const BASE_TILE_SIZE = 32;
  const GRID_TILE_SIZE = BASE_TILE_SIZE * zoomLevel;

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

    const centerViewport = () => {
      if (containerRef.current && !isInitialized) {
        // Centralizar o viewport no meio do grid infinito
        const centerX = (1000000 - viewport.width) / 2;
        const centerY = (1000000 - viewport.height) / 2;
        
        containerRef.current.scrollLeft = centerX;
        containerRef.current.scrollTop = centerY;
        
        setIsInitialized(true);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Centralizar após um pequeno delay para garantir que o viewport foi calculado
      setTimeout(centerViewport, 100);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [viewport.width, viewport.height, isInitialized]);

  const handleCellClick = (x: number, y: number, isRightClick: boolean = false) => {
    if (isRightClick) {
      removeTile(x, y);
      setLastErasedCell({ x, y });
    } else if (activeTile) {
      placeTile(x, y, activeTile);
      setLastDrawnCell({ x, y });
    }
  };

  const handleMouseDown = (x: number, y: number, isRightClick: boolean = false, isMiddleClick: boolean = false, mouseEvent?: React.MouseEvent) => {
    if (isMiddleClick && mouseEvent) {
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      setIsPanning(true);
      setPanStart({ 
        x: mouseEvent.clientX, 
        y: mouseEvent.clientY,
        scrollX: scrollPosition.x,
        scrollY: scrollPosition.y
      });
    } else if (isRightClick) {
      setIsErasing(true);
      removeTile(x, y);
      setLastErasedCell({ x, y });
    } else if (activeTile) {
      setIsDragging(true);
      placeTile(x, y, activeTile);
      setLastDrawnCell({ x, y });
    }
  };

  const handleMouseEnter = (x: number, y: number, isRightClick: boolean = false) => {
    if (isRightClick && isErasing && lastErasedCell && (lastErasedCell.x !== x || lastErasedCell.y !== y)) {
      removeTile(x, y);
      setLastErasedCell({ x, y });
    } else if (isDragging && activeTile && lastDrawnCell && (lastDrawnCell.x !== x || lastDrawnCell.y !== y)) {
      placeTile(x, y, activeTile);
      setLastDrawnCell({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsErasing(false);
    setIsPanning(false);
    setLastDrawnCell(null);
    setLastErasedCell(null);
    setPanStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      // Calcular o ponto de zoom (onde o mouse está)
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Salvar posição relativa do mouse
      const relativeX = mouseX / e.currentTarget.scrollWidth;
      const relativeY = mouseY / e.currentTarget.scrollHeight;
      
      setZoomLevel(newZoom);
      
      // Ajustar scroll para manter o ponto de zoom no mesmo lugar
      setTimeout(() => {
        if (containerRef.current) {
          const newScrollX = (relativeX * containerRef.current.scrollWidth) - mouseX;
          const newScrollY = (relativeY * containerRef.current.scrollHeight) - mouseY;
          
          containerRef.current.scrollLeft = newScrollX;
          containerRef.current.scrollTop = newScrollY;
        }
      }, 0);
    }
  };

  const centerOnContent = () => {
    if (containerRef.current) {
      const bounds = getMapBounds();
      
      // Se não há tiles, centralizar no meio do grid
      if (bounds.width === 1 && bounds.height === 1) {
        const centerX = (1000000 - viewport.width) / 2;
        const centerY = (1000000 - viewport.height) / 2;
        
        containerRef.current.scrollLeft = Math.max(0, centerX);
        containerRef.current.scrollTop = Math.max(0, centerY);
        return;
      }
      
      // Calcular o centro do conteúdo
      const contentCenterX = (bounds.minX + bounds.maxX) / 2;
      const contentCenterY = (bounds.minY + bounds.maxY) / 2;
      
      // Converter para coordenadas de scroll
      const scrollX = (contentCenterX * GRID_TILE_SIZE) - (viewport.width / 2);
      const scrollY = (contentCenterY * GRID_TILE_SIZE) - (viewport.height / 2);
      
      // Limitar aos limites do grid
      const maxScrollX = 1000000 - viewport.width;
      const maxScrollY = 1000000 - viewport.height;
      const limitedScrollX = Math.max(0, Math.min(maxScrollX, scrollX));
      const limitedScrollY = Math.max(0, Math.min(maxScrollY, scrollY));
      
      // Aplicar scroll com animação suave
      containerRef.current.scrollTo({
        left: limitedScrollX,
        top: limitedScrollY,
        behavior: 'smooth'
      });
    }
  };

  // Adicionar event listeners para mouse up global e mouse move para panning
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsErasing(false);
      setIsPanning(false);
      setLastDrawnCell(null);
      setLastErasedCell(null);
      setPanStart(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Só aplicar panning se estiver realmente fazendo panning e não desenhando
      if (isPanning && panStart && containerRef.current && !isDragging && !isErasing) {
        const deltaX = panStart.x - e.clientX;
        const deltaY = panStart.y - e.clientY;
        
        const newScrollX = panStart.scrollX + deltaX;
        const newScrollY = panStart.scrollY + deltaY;
        
        // Limitar o scroll aos limites do grid
        const maxScrollX = 1000000 - viewport.width;
        const maxScrollY = 1000000 - viewport.height;
        
        containerRef.current.scrollLeft = Math.max(0, Math.min(maxScrollX, newScrollX));
        containerRef.current.scrollTop = Math.max(0, Math.min(maxScrollY, newScrollY));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+G (macOS) / Ctrl+G (Windows/Linux) para centralizar
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        centerOnContent();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanning, panStart]);

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
    <main className="flex-1 bg-custom-pure-black overflow-hidden relative">
      {/* Indicador de zoom */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      {/* Botão de centralizar */}
      <button
        onClick={centerOnContent}
        className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50 hover:bg-opacity-70 transition-all duration-200 flex items-center gap-2"
        title="Centralizar no conteúdo"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6"/>
          <path d="M1 12h6m6 0h6"/>
        </svg>
        Centralizar
      </button>
      {/* Container para tiles com scroll */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-auto"
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            setIsPanning(true);
            setPanStart({ 
              x: e.clientX, 
              y: e.clientY,
              scrollX: scrollPosition.x,
              scrollY: scrollPosition.y
            });
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 1) {
            setIsPanning(false);
            setPanStart(null);
          }
        }}
        onWheel={handleWheel}
      >
        <div 
          style={{ 
            position: 'relative',
            width: '1000000px', // Grid realmente infinito
            height: '1000000px',
            padding: '50px'
          }}
        >
          {/* Grid infinito de fundo - move com o scroll */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
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
                    cursor: isPanning ? 'grabbing' : 'grab',
                    backgroundColor: 'transparent',
                  }}
                onClick={(e) => handleCellClick(x, y, e.button === 2)}
                onMouseDown={(e) => handleMouseDown(x, y, e.button === 2, e.button === 1, e)}
                onContextMenu={(e) => e.preventDefault()}
                onMouseEnter={(e) => {
                  handleMouseEnter(x, y, e.buttons === 2);
                  if (isPanning) {
                    e.currentTarget.style.cursor = 'grabbing';
                  } else if (e.buttons === 1) {
                    e.currentTarget.style.cursor = 'grabbing';
                  } else if (activeTile && e.buttons !== 2) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,255,0,0.2)';
                    e.currentTarget.style.cursor = 'pointer';
                  } else if (e.buttons === 2) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.2)';
                    e.currentTarget.style.cursor = 'pointer';
                  } else {
                    e.currentTarget.style.cursor = 'grab';
                  }
                }}
                onMouseUp={handleMouseUp}
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
