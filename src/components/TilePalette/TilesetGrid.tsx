import { Upload } from '@nsmr/pixelart-react';
import { useState, useEffect, useRef } from 'react';
import { useTilesetStore } from '../../hooks/useTileset';

const BASE_TILE_DISPLAY_SIZE = 32; // Tamanho base para mostrar tiles

export default function TilesetGrid() {
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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Não permitir zoom se o container não está pronto
    if (!containerRef.current) return;
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      if (!containerRef.current) return;
      
      // Calcular o ponto de zoom (onde o mouse está)
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcular posição atual do scroll
      const currentScrollX = containerRef.current.scrollLeft;
      const currentScrollY = containerRef.current.scrollTop;
      
      // Calcular posição absoluta do mouse no grid
      const absoluteMouseX = currentScrollX + mouseX;
      const absoluteMouseY = currentScrollY + mouseY;
      
      // Calcular a razão de zoom
      const zoomRatio = newZoom / zoomLevel;
      
      // Calcular nova posição de scroll para manter o mouse no mesmo ponto
      const newScrollX = absoluteMouseX * zoomRatio - mouseX;
      const newScrollY = absoluteMouseY * zoomRatio - mouseY;
      
      setZoomLevel(newZoom);
      
      // Aplicar o novo scroll com limites
      setTimeout(() => {
        if (containerRef.current) {
          // Limitar o scroll aos limites do container
          const maxScrollX = Math.max(0, containerRef.current.scrollWidth - containerRef.current.clientWidth);
          const maxScrollY = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
          
          const clampedX = Math.max(0, Math.min(maxScrollX, newScrollX));
          const clampedY = Math.max(0, Math.min(maxScrollY, newScrollY));
          
          containerRef.current.scrollLeft = clampedX;
          containerRef.current.scrollTop = clampedY;
          
          // Atualizar posição do scroll
          setScrollPosition({ x: clampedX, y: clampedY });
        }
      }, 0);
    }
  };

  const handleMouseDown = (x: number, y: number, isRightClick: boolean = false, isMiddleClick: boolean = false, mouseEvent?: React.MouseEvent) => {
    if (isMiddleClick && mouseEvent) {
      setIsPanning(true);
      setPanStart({ 
        x: mouseEvent.clientX, 
        y: mouseEvent.clientY,
        scrollX: scrollPosition.x,
        scrollY: scrollPosition.y
      });
    } else if (isRightClick) {
      // Botão direito limpa a seleção
      clearSelection();
    } else {
      // Botão esquerdo inicia seleção
      setIsSelecting(true);
      setSelectionStart({ x, y });
      selectTilesInArea(x, y, x, y); // Selecionar apenas o tile inicial
    }
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isSelecting && selectionStart) {
      // Atualizar seleção conforme arrasta
      selectTilesInArea(selectionStart.x, selectionStart.y, x, y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsSelecting(false);
    setPanStart(null);
    setSelectionStart(null);
  };

  // Event listeners globais
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setIsSelecting(false);
      setPanStart(null);
      setSelectionStart(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart && containerRef.current) {
        const deltaX = panStart.x - e.clientX;
        const deltaY = panStart.y - e.clientY;
        
        const newScrollX = panStart.scrollX + deltaX;
        const newScrollY = panStart.scrollY + deltaY;
        
        // Limitar o scroll aos limites do container
        const maxScrollX = Math.max(0, containerRef.current.scrollWidth - containerRef.current.clientWidth);
        const maxScrollY = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
        
        const clampedX = Math.max(0, Math.min(maxScrollX, newScrollX));
        const clampedY = Math.max(0, Math.min(maxScrollY, newScrollY));
        
        containerRef.current.scrollLeft = clampedX;
        containerRef.current.scrollTop = clampedY;
        
        // Atualizar posição do scroll
        setScrollPosition({ x: clampedX, y: clampedY });
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
    };
  }, [isPanning, panStart, scrollPosition]);

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-custom-white flex justify-between items-center">
        <span>Tileset Grid</span>
        <span className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          {Math.round(zoomLevel * 100)}%
        </span>
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
              style={{
                width: Math.floor(tileset.width / tileSize.width) * TILE_DISPLAY_SIZE,
                height: Math.floor(tileset.height / tileSize.height) * TILE_DISPLAY_SIZE,
                backgroundImage: `
                  url(${tileset.src}),
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `
                  ${Math.floor(tileset.width / tileSize.width) * TILE_DISPLAY_SIZE}px ${Math.floor(tileset.height / tileSize.height) * TILE_DISPLAY_SIZE}px,
                  ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px,
                  ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px
                `,
                backgroundRepeat: 'no-repeat, repeat, repeat',
                backgroundPosition: `0 0, 0 0, 0 0`,
                imageRendering: 'pixelated',
              }}
            >
              {/* Grid clicável sem bordas */}
              <div 
                className="absolute inset-0"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.floor(tileset.width / tileSize.width)}, ${TILE_DISPLAY_SIZE}px)`,
                  gridTemplateRows: `repeat(${Math.floor(tileset.height / tileSize.height)}, ${TILE_DISPLAY_SIZE}px)`,
                }}
              >
                {Array.from({ length: Math.floor(tileset.height / tileSize.height) }, (_, y) =>
                  Array.from({ length: Math.floor(tileset.width / tileSize.width) }, (_, x) => {
                    const tileId = `${x}_${y}`;
                    const isActive = activeTile === tileId;
                    const isSelected = selectedTiles.includes(tileId);
                    
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`cursor-pointer border border-transparent hover:border-custom-color hover:bg-custom-color/20 transition-colors ${
                          isActive ? 'border-custom-color bg-custom-color/30' : 
                          isSelected ? 'border-blue-400 bg-blue-400/20' : ''
                        }`}
                        style={{
                          width: TILE_DISPLAY_SIZE,
                          height: TILE_DISPLAY_SIZE,
                          cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'grab',
                        }}
                        onClick={() => selectTileFromGrid(x, y)}
                        onMouseDown={(e) => handleMouseDown(x, y, e.button === 2, e.button === 1, e)}
                        onContextMenu={(e) => e.preventDefault()}
                        onMouseEnter={(e) => {
                          handleMouseEnter(x, y);
                          if (isPanning) {
                            e.currentTarget.style.cursor = 'grabbing';
                          } else if (isSelecting) {
                            e.currentTarget.style.cursor = 'crosshair';
                          } else if (e.buttons === 1) {
                            e.currentTarget.style.cursor = 'crosshair';
                          } else if (e.buttons === 2) {
                            e.currentTarget.style.cursor = 'pointer';
                          } else {
                            e.currentTarget.style.cursor = 'grab';
                          }
                        }}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.cursor = 'grab';
                        }}
                        title={`Tile ${x},${y}${isSelected ? ' (Selected)' : ''}`}
                      >
                        {isActive && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-custom-color rounded-full opacity-80"></div>
                          </div>
                        )}
                        {isSelected && !isActive && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                          </div>
                        )}
                      </div>
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
            <div className="text-2xl mb-2"><Upload size={24} /></div>
            <div className="text-sm">No tileset loaded</div>
            <div className="text-xs mt-1">Click "Import Tileset" to load an image</div>
          </div>
        </div>
      )}
      
      {/* Informações do tile selecionado */}
      {(activeTile || selectedTiles.length > 0) && (
        <div className="mt-2 p-2 bg-custom-black border border-custom-light-gray text-xs text-custom-white">
          {selectedTiles.length > 1 ? (
            <>
              <div className="font-medium">Selected Tiles: {selectedTiles.length}</div>
              <div className="text-custom-light-gray">
                Area: {selectionBounds ? 
                  `${selectionBounds.maxX - selectionBounds.minX + 1} x ${selectionBounds.maxY - selectionBounds.minY + 1}` : 
                  'Multiple'
                }
              </div>
              <div className="text-custom-light-gray">Size: {tileSize.width} x {tileSize.height}</div>
              <div className="text-blue-400 mt-1">
                Active: {activeTile}
              </div>
            </>
          ) : (
            <>
              <div className="font-medium">Selected Tile: {activeTile}</div>
              <div className="text-custom-light-gray">Size: {tileSize.width} x {tileSize.height}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
