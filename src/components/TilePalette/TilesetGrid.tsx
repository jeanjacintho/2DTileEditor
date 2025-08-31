import { Upload } from '@nsmr/pixelart-react';
import { useState, useEffect, useRef } from 'react';
import { useTilesetStore } from '../../hooks/useTileset';

const BASE_TILE_DISPLAY_SIZE = 32; // Tamanho base para mostrar tiles

export default function TilesetGrid() {
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectTileFromGrid = useTilesetStore(s => s.selectTileFromGrid);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const [lastSelectedTile, setLastSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const TILE_DISPLAY_SIZE = BASE_TILE_DISPLAY_SIZE * zoomLevel;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const relativeX = mouseX / e.currentTarget.scrollWidth;
      const relativeY = mouseY / e.currentTarget.scrollHeight;
      
      setZoomLevel(newZoom);
      
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

  const handleMouseDown = (x: number, y: number, isRightClick: boolean = false, isMiddleClick: boolean = false, mouseEvent?: React.MouseEvent) => {
    if (isMiddleClick && mouseEvent) {
      setIsPanning(true);
      setPanStart({ 
        x: mouseEvent.clientX, 
        y: mouseEvent.clientY,
        scrollX: containerRef.current?.scrollLeft || 0,
        scrollY: containerRef.current?.scrollTop || 0
      });
    } else if (isRightClick) {
      // Botão direito pode ser usado para desmarcar seleção
      selectTileFromGrid(x, y);
      setLastSelectedTile({ x, y });
    } else {
      setIsDragging(true);
      selectTileFromGrid(x, y);
      setLastSelectedTile({ x, y });
    }
  };

  const handleMouseEnter = (x: number, y: number, isRightClick: boolean = false) => {
    if (isDragging && lastSelectedTile && (lastSelectedTile.x !== x || lastSelectedTile.y !== y)) {
      selectTileFromGrid(x, y);
      setLastSelectedTile({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    setLastSelectedTile(null);
    setPanStart(null);
  };

  // Event listeners globais
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
      setLastSelectedTile(null);
      setPanStart(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart && containerRef.current) {
        const deltaX = panStart.x - e.clientX;
        const deltaY = panStart.y - e.clientY;
        
        containerRef.current.scrollLeft = panStart.scrollX + deltaX;
        containerRef.current.scrollTop = panStart.scrollY + deltaY;
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isPanning, panStart]);

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-custom-white flex justify-between items-center">
        <span>Tileset Grid</span>
        <span className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>
      {tileset ? (
        <div 
          ref={containerRef}
          className="border border-custom-light-gray bg-custom-pure-black overflow-auto" 
          style={{ maxHeight: '300px' }}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              setIsPanning(true);
              setPanStart({ 
                x: e.clientX, 
                y: e.clientY,
                scrollX: containerRef.current?.scrollLeft || 0,
                scrollY: containerRef.current?.scrollTop || 0
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
              backgroundPosition: '0 0, 0 0, 0 0',
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
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`cursor-pointer border border-transparent hover:border-custom-color hover:bg-custom-color/20 transition-colors ${
                        isActive ? 'border-custom-color bg-custom-color/30' : ''
                      }`}
                      style={{
                        width: TILE_DISPLAY_SIZE,
                        height: TILE_DISPLAY_SIZE,
                        cursor: isPanning ? 'grabbing' : 'grab',
                      }}
                      onClick={(e) => selectTileFromGrid(x, y)}
                      onMouseDown={(e) => handleMouseDown(x, y, e.button === 2, e.button === 1, e)}
                      onContextMenu={(e) => e.preventDefault()}
                      onMouseEnter={(e) => {
                        handleMouseEnter(x, y, e.buttons === 2);
                        if (isPanning) {
                          e.currentTarget.style.cursor = 'grabbing';
                        } else if (e.buttons === 1) {
                          e.currentTarget.style.cursor = 'grabbing';
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
                      title={`Tile ${x},${y}`}
                    >
                      {isActive && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-custom-color rounded-full opacity-80"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
      {activeTile && (
        <div className="mt-2 p-2 bg-custom-black border border-custom-light-gray text-xs text-custom-white">
          <div className="font-medium">Selected Tile: {activeTile}</div>
          <div className="text-custom-light-gray">Size: {tileSize.width} x {tileSize.height}</div>
        </div>
      )}
    </div>
  );
}
