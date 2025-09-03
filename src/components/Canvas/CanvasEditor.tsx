import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';
import { useDrawModeStore } from '../../hooks/useDrawMode';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const removeTile = useTileMapStore(s => s.removeTile);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const tileSize = useTilesetStore(s => s.tileSize);
  const drawMode = useDrawModeStore(s => s.drawMode);
  
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastDrawnCell, setLastDrawnCell] = useState<{ x: number; y: number } | null>(null);
  const [lastErasedCell, setLastErasedCell] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const [rectSelection, setRectSelection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tamanho base do grid
  const BASE_TILE_SIZE = 32;
  const GRID_TILE_SIZE = BASE_TILE_SIZE * zoomLevel;

  // Função para limitar scroll aos limites do grid
  const clampScroll = useCallback((x: number, y: number) => {
    const maxScrollX = Math.max(0, 1000000 - viewport.width);
    const maxScrollY = Math.max(0, 1000000 - viewport.height);
    return {
      x: Math.max(0, Math.min(maxScrollX, x)),
      y: Math.max(0, Math.min(maxScrollY, y))
    };
  }, [viewport.width, viewport.height]);

  // Função para centralizar o viewport
  const centerOnContent = useCallback(() => {
    if (!containerRef.current) return;
    
    const bounds = getMapBounds();
    
    // Se não há tiles ou bounds inválidos, centralizar no meio do grid
    if (bounds.width <= 1 && bounds.height <= 1) {
      const centerX = (1000000 - viewport.width) / 2;
      const centerY = (1000000 - viewport.height) / 2;
      
      const clamped = clampScroll(centerX, centerY);
      containerRef.current.scrollTo({
        left: clamped.x,
        top: clamped.y,
        behavior: 'smooth'
      });
      return;
    }
    
    // Calcular o centro do conteúdo
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    
    // Converter para coordenadas de scroll
    const scrollX = (contentCenterX * GRID_TILE_SIZE) - (viewport.width / 2);
    const scrollY = (contentCenterY * GRID_TILE_SIZE) - (viewport.height / 2);
    
    // Aplicar limites e scroll
    const clamped = clampScroll(scrollX, scrollY);
    containerRef.current.scrollTo({
      left: clamped.x,
      top: clamped.y,
      behavior: 'smooth'
    });
  }, [getMapBounds, viewport.width, viewport.height, GRID_TILE_SIZE, clampScroll]);

  // Função para desenhar tiles em uma área retangular
  const drawRectangularArea = useCallback((startX: number, startY: number, endX: number, endY: number, tileId: string) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        placeTile(x, y, tileId);
      }
    }
  }, [placeTile, drawMode]);

  // Função para remover tiles em uma área retangular
  const removeRectangularArea = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        removeTile(x, y);
      }
    }
  }, [removeTile, drawMode]);

  // Inicialização do viewport
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

    const initializeViewport = () => {
      if (containerRef.current && !isInitialized && viewport.width > 0 && viewport.height > 0) {
        // Centralizar o viewport no meio do grid infinito
        const centerX = (1000000 - viewport.width) / 2;
        const centerY = (1000000 - viewport.height) / 2;
        
        const clamped = clampScroll(centerX, centerY);
        containerRef.current.scrollLeft = clamped.x;
        containerRef.current.scrollTop = clamped.y;
        
        setIsInitialized(true);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    // Inicializar viewport após um pequeno delay para garantir que as dimensões foram calculadas
    const initTimer = setTimeout(initializeViewport, 50);
    
    // Se o viewport já tem dimensões, inicializar imediatamente
    if (viewport.width > 0 && viewport.height > 0) {
      initializeViewport();
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(initTimer);
    };
  }, [isInitialized, viewport.width, viewport.height, clampScroll]);

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
      setRectSelection({ startX: x, startY: y, endX: x, endY: y });
      removeTile(x, y);
      setLastErasedCell({ x, y });
    } else if (activeTile) {
      setIsDragging(true);
      setRectSelection({ startX: x, startY: y, endX: x, endY: y });
      placeTile(x, y, activeTile);
      setLastDrawnCell({ x, y });
    }
  };

  const handleMouseEnter = (x: number, y: number, isRightClick: boolean = false) => {
    if (isRightClick && isErasing && lastErasedCell && (lastErasedCell.x !== x || lastErasedCell.y !== y)) {
      if (rectSelection && drawMode === 'rectangular') {
        // Atualizar seleção retangular
        setRectSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
        // Remover área retangular
        removeRectangularArea(rectSelection.startX, rectSelection.startY, x, y);
      } else {
        removeTile(x, y);
      }
      setLastErasedCell({ x, y });
    } else if (isDragging && activeTile && lastDrawnCell && (lastDrawnCell.x !== x || lastDrawnCell.y !== y)) {
      if (rectSelection && drawMode === 'rectangular') {
        // Atualizar seleção retangular
        setRectSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
        // Desenhar área retangular
        drawRectangularArea(rectSelection.startX, rectSelection.startY, x, y, activeTile);
      } else {
        placeTile(x, y, activeTile);
      }
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
    setRectSelection(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Não permitir zoom se o viewport não foi inicializado
    if (!isInitialized || viewport.width === 0 || viewport.height === 0) return;
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
    
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
          const clamped = clampScroll(newScrollX, newScrollY);
          containerRef.current.scrollLeft = clamped.x;
          containerRef.current.scrollTop = clamped.y;
        }
      }, 0);
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
      setRectSelection(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Só aplicar panning se estiver realmente fazendo panning e não desenhando
      if (isPanning && panStart && containerRef.current && !isDragging && !isErasing) {
        const deltaX = panStart.x - e.clientX;
        const deltaY = panStart.y - e.clientY;
        
        const newScrollX = panStart.scrollX + deltaX;
        const newScrollY = panStart.scrollY + deltaY;
        
        const clamped = clampScroll(newScrollX, newScrollY);
        containerRef.current.scrollLeft = clamped.x;
        containerRef.current.scrollTop = clamped.y;
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
  }, [isPanning, panStart, isDragging, isErasing, clampScroll, centerOnContent, drawMode]);

  // Calcular células visíveis baseadas no viewport e scroll
  const visibleCells = useMemo(() => {
    // Garantir que as células sejam alinhadas com o grid
    const startX = Math.floor(scrollPosition.x / GRID_TILE_SIZE);
    const startY = Math.floor(scrollPosition.y / GRID_TILE_SIZE);
    const visibleCols = Math.ceil(viewport.width / GRID_TILE_SIZE) + 2; // Buffer reduzido
    const visibleRows = Math.ceil(viewport.height / GRID_TILE_SIZE) + 2; // Buffer reduzido

    const cells = [];
    for (let y = startY; y < startY + visibleRows; y++) {
      for (let x = startX; x < startX + visibleCols; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, [scrollPosition.x, scrollPosition.y, viewport.width, viewport.height, GRID_TILE_SIZE]);

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

  // Calcular área de seleção retangular para renderização
  const selectionArea = useMemo(() => {
    if (!rectSelection) return null;
    
    const minX = Math.min(rectSelection.startX, rectSelection.endX);
    const maxX = Math.max(rectSelection.startX, rectSelection.endX);
    const minY = Math.min(rectSelection.startY, rectSelection.endY);
    const maxY = Math.max(rectSelection.startY, rectSelection.endY);
    
    return {
      left: minX * GRID_TILE_SIZE,
      top: minY * GRID_TILE_SIZE,
      width: (maxX - minX + 1) * GRID_TILE_SIZE,
      height: (maxY - minY + 1) * GRID_TILE_SIZE,
    };
  }, [rectSelection, GRID_TILE_SIZE, drawMode]);

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

      {/* Indicador de modo de desenho */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        {isDragging ? 'Desenhando' : isErasing ? 'Apagando' : isPanning ? 'Panning' : 'Pronto'}
        {drawMode === 'rectangular' && ' (Retangular)'}
      </div>

      {/* Indicador de navegação */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        <span className="text-xs">Use o botão do meio do mouse para navegar</span>
      </div>

      {/* Debug: Informações do grid */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        <div className="text-xs">
          <div>Grid Size: {GRID_TILE_SIZE}px</div>
          <div>Scroll: {Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)}</div>
          <div>Cells: {visibleCells.length}</div>
        </div>
      </div>

      {/* Container para tiles com scroll */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
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
            height: '1000000px'
          }}
        >
          {/* Grid infinito de fundo - move com o scroll */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
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

          {/* Área de seleção retangular */}
          {selectionArea && drawMode === 'rectangular' && (
            <div
              style={{
                position: 'absolute',
                left: selectionArea.left,
                top: selectionArea.top,
                width: selectionArea.width,
                height: selectionArea.height,
                border: '2px dashed #00ff00',
                backgroundColor: isErasing ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)',
                pointerEvents: 'none',
                zIndex: 2000,
              }}
            />
          )}

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
                  border: '1px solid rgba(255,255,255,0.3)', // Debug: borda temporária
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
