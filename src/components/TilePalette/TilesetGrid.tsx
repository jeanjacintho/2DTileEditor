import { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useTilesetStore } from '../../hooks/useTileset';
import { Folder } from '@nsmr/pixelart-react';

const BASE_TILE_DISPLAY_SIZE = 32;

// Componente individual de tile memoizado para evitar re-renders desnecessários
const TileElement = memo(({ 
  x, 
  y, 
  isActive, 
  isSelected, 
  TILE_DISPLAY_SIZE, 
  onTileClick, 
  onMouseDown, 
  onMouseEnter, 
  onMouseUp, 
  onMouseLeave,
  isPanning,
  isSelecting 
}: {
  x: number;
  y: number;
  isActive: boolean;
  isSelected: boolean;
  TILE_DISPLAY_SIZE: number;
  onTileClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  isPanning: boolean;
  isSelecting: boolean;
}) => {
  // Memoizar classes CSS para evitar recálculos
  const tileClasses = useMemo(() => {
    const baseClasses = 'cursor-pointer border border-transparent hover:border-custom-color hover:bg-custom-color/20 transition-colors';
    
    if (isActive) {
      return `${baseClasses} border-custom-color bg-custom-color/30`;
    } else if (isSelected) {
      return `${baseClasses} border-custom-color bg-custom-color/20`;
    }
    
    return baseClasses;
  }, [isActive, isSelected]);

  // Memoizar estilo para evitar recálculos
  const tileStyle = useMemo(() => ({
    width: TILE_DISPLAY_SIZE,
    height: TILE_DISPLAY_SIZE,
    cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'grab',
    willChange: 'transform', // Otimização para GPU
  }), [TILE_DISPLAY_SIZE, isPanning, isSelecting]);

  return (
    <div
      className={tileClasses}
      style={tileStyle}
      onClick={onTileClick}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      title={`Tile ${x},${y}${isSelected ? ' (Selected)' : ''}`}
    >
      {isActive && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-3 bg-custom-color rounded-full opacity-80"></div>
        </div>
      )}
      {isSelected && !isActive && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 bg-custom-color rounded-full opacity-60"></div>
        </div>
      )}
    </div>
  );
});

TileElement.displayName = 'TileElement';

const TilesetGrid = memo(() => {
  // Usar hooks originais para manter funcionalidade
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectedTiles = useTilesetStore(s => s.selectedTiles);
  const selectionBounds = useTilesetStore(s => s.selectionBounds);
  const selectTileFromGrid = useTilesetStore(s => s.selectTileFromGrid);
  const selectTilesInArea = useTilesetStore(s => s.selectTilesInArea);
  const clearSelection = useTilesetStore(s => s.clearSelection);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const TILE_DISPLAY_SIZE = BASE_TILE_DISPLAY_SIZE * zoomLevel;

  // Calcular dimensões do tileset corretamente
  const tilesetDimensions = useMemo(() => {
    if (!tileset) return { cols: 0, rows: 0, width: 0, height: 0 };
    
    const cols = Math.floor(tileset.width / tileSize.width);
    const rows = Math.floor(tileset.height / tileSize.height);
    
    return {
      cols,
      rows,
      width: cols * TILE_DISPLAY_SIZE,
      height: rows * TILE_DISPLAY_SIZE
    };
  }, [tileset, tileSize.width, tileSize.height, TILE_DISPLAY_SIZE]);

  // Memoizar estilo do container principal
  const containerStyle = useMemo(() => ({
    width: tilesetDimensions.width,
    height: tilesetDimensions.height,
    backgroundImage: tileset ? `
      url(${tileset.src}),
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
    ` : 'none',
    backgroundSize: tileset ? `
      ${tilesetDimensions.width}px ${tilesetDimensions.height}px,
      ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px,
      ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px
    ` : 'none',
    backgroundRepeat: 'no-repeat, repeat, repeat',
    backgroundPosition: '0 0, 0 0, 0 0',
    imageRendering: 'pixelated' as const,
    willChange: 'transform', // Otimização para GPU
  }), [tileset, tilesetDimensions, TILE_DISPLAY_SIZE]);

  // Throttling para eventos de mouse
  const lastMouseMoveTime = useRef(0);
  const THROTTLE_MS = 8; // ~120fps

  // Handlers otimizados com throttling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      // Calcular o ponto de zoom
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const currentScrollX = containerRef.current.scrollLeft;
      const currentScrollY = containerRef.current.scrollTop;
      
      const absoluteMouseX = currentScrollX + mouseX;
      const absoluteMouseY = currentScrollY + mouseY;
      
      const zoomRatio = newZoom / zoomLevel;
      
      const newScrollX = absoluteMouseX * zoomRatio - mouseX;
      const newScrollY = absoluteMouseY * zoomRatio - mouseY;
      
      setZoomLevel(newZoom);
      
      // Usar RAF para melhor performance
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const maxScrollX = Math.max(0, containerRef.current.scrollWidth - containerRef.current.clientWidth);
          const maxScrollY = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
          
          const clampedX = Math.max(0, Math.min(maxScrollX, newScrollX));
          const clampedY = Math.max(0, Math.min(maxScrollY, newScrollY));
          
          containerRef.current.scrollLeft = clampedX;
          containerRef.current.scrollTop = clampedY;
          
          setScrollPosition({ x: clampedX, y: clampedY });
        }
      });
    }
  }, [zoomLevel]);

  const handleMouseDown = useCallback((x: number, y: number, isRightClick: boolean = false, isMiddleClick: boolean = false, mouseEvent?: React.MouseEvent) => {
    if (isMiddleClick && mouseEvent) {
      setIsPanning(true);
      setPanStart({ 
        x: mouseEvent.clientX, 
        y: mouseEvent.clientY,
        scrollX: scrollPosition.x,
        scrollY: scrollPosition.y
      });
    } else if (isRightClick) {
      clearSelection();
    } else {
      setIsSelecting(true);
      setSelectionStart({ x, y });
      selectTilesInArea(x, y, x, y);
    }
  }, [scrollPosition, clearSelection, selectTilesInArea]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastMouseMoveTime.current < THROTTLE_MS) return;
    lastMouseMoveTime.current = now;

    if (isSelecting && selectionStart) {
      requestAnimationFrame(() => {
        selectTilesInArea(selectionStart.x, selectionStart.y, x, y);
      });
    }
  }, [isSelecting, selectionStart, selectTilesInArea]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsSelecting(false);
    setPanStart(null);
    setSelectionStart(null);
  }, []);

  // Event listeners otimizados com RAF
  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setIsSelecting(false);
      setPanStart(null);
      setSelectionStart(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart && containerRef.current) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const deltaX = panStart.x - e.clientX;
          const deltaY = panStart.y - e.clientY;
          
          const newScrollX = panStart.scrollX + deltaX;
          const newScrollY = panStart.scrollY + deltaY;
          
          const maxScrollX = Math.max(0, containerRef.current!.scrollWidth - containerRef.current!.clientWidth);
          const maxScrollY = Math.max(0, containerRef.current!.scrollHeight - containerRef.current!.clientHeight);
          
          const clampedX = Math.max(0, Math.min(maxScrollX, newScrollX));
          const clampedY = Math.max(0, Math.min(maxScrollY, newScrollY));
          
          containerRef.current!.scrollLeft = clampedX;
          containerRef.current!.scrollTop = clampedY;
          
          setScrollPosition({ x: clampedX, y: clampedY });
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

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPanning, panStart]);

  // Memoizar informações do tile selecionado
  const tileInfo = useMemo(() => {
    if (!activeTile && selectedTiles.length === 0) return null;
    
    if (selectedTiles.length > 1) {
      return {
        type: 'multiple' as const,
        count: selectedTiles.length,
        area: selectionBounds ? 
          `${selectionBounds.maxX - selectionBounds.minX + 1} x ${selectionBounds.maxY - selectionBounds.minY + 1}` : 
          'Multiple',
        activeTile
      };
    } else {
      return {
        type: 'single' as const,
        tileId: activeTile,
        size: `${tileSize.width} x ${tileSize.height}`
      };
    }
  }, [activeTile, selectedTiles, selectionBounds, tileSize]);

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-custom-white flex justify-between items-center">
        <span>Tileset Grid</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {Math.round(zoomLevel * 100)}%
          </span>
          <span className="text-xs bg-custom-color bg-opacity-50 text-white px-2 py-1 rounded">
            {tilesetDimensions.cols * tilesetDimensions.rows} tiles
          </span>
        </div>
      </div>
      
      {tileset ? (
        <div className="relative">
          <div 
            ref={containerRef}
            className="border border-custom-light-gray bg-custom-pure-black overflow-hidden" 
            style={{ maxHeight: '300px' }}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
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
              className="relative"
              style={containerStyle}
            >
              {/* Grid clicável otimizado - renderizar todos os tiles mas com otimizações */}
              <div 
                className="absolute inset-0"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${tilesetDimensions.cols}, ${TILE_DISPLAY_SIZE}px)`,
                  gridTemplateRows: `repeat(${tilesetDimensions.rows}, ${TILE_DISPLAY_SIZE}px)`,
                }}
              >
                {Array.from({ length: tilesetDimensions.rows }, (_, y) =>
                  Array.from({ length: tilesetDimensions.cols }, (_, x) => {
                    const tileId = `${x}_${y}`;
                    const isActive = activeTile === tileId;
                    const isSelected = selectedTiles.includes(tileId);
                    
                    return (
                      <TileElement
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        isActive={isActive}
                        isSelected={isSelected}
                        TILE_DISPLAY_SIZE={TILE_DISPLAY_SIZE}
                        onTileClick={() => selectTileFromGrid(x, y)}
                        onMouseDown={(e) => handleMouseDown(x, y, e.button === 2, e.button === 1, e)}
                        onMouseEnter={() => handleMouseEnter(x, y)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.cursor = 'grab';
                        }}
                        isPanning={isPanning}
                        isSelecting={isSelecting}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-custom-light-gray bg-custom-pure-black h-48 flex items-center justify-center text-custom-light-gray">
          <div className="flex flex-col items-center justify-center text-center">
            <Folder size={32} className="text-custom-light-gray mb-2" />
            <div className="text-sm">No tileset loaded</div>
            <div className="text-xs mt-1">Click "Import Tileset" to load an image</div>
          </div>
        </div>
      )}
      
      {/* Informações do tile selecionado */}
      {tileInfo && (
        <div className="mt-2 p-2 bg-custom-black border border-custom-light-gray text-xs text-custom-white">
          {tileInfo.type === 'multiple' ? (
            <>
              <div className="font-medium">Selected Tiles: {tileInfo.count}</div>
              <div className="text-custom-light-gray">Area: {tileInfo.area}</div>
              <div className="text-custom-light-gray">Size: {tileSize.width} x {tileSize.height}</div>
              <div className="text-custom-color mt-1">Active: {tileInfo.activeTile}</div>
            </>
          ) : (
            <>
              <div className="font-medium">Selected Tile: {tileInfo.tileId}</div>
              <div className="text-custom-light-gray">Size: {tileInfo.size}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

TilesetGrid.displayName = 'TilesetGrid';

export default TilesetGrid;