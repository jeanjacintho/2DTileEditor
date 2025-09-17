import { useState, useEffect, useRef, useMemo, useCallback, memo, useTransition } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';
import { useDrawModeStore } from '../../hooks/useDrawMode';
import LayerRenderer from './LayerRenderer';
import BackgroundGrid from './BackgroundGrid';

// Otimização: Seletores específicos para evitar re-renders desnecessários
const CanvasEditor = memo(() => {
  // Usar hooks básicos para garantir funcionamento
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const removeTile = useTileMapStore(s => s.removeTile);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectedTiles = useTilesetStore(s => s.selectedTiles);
  const selectionBounds = useTilesetStore(s => s.selectionBounds);
  const tileSize = useTilesetStore(s => s.tileSize);
  
  const drawMode = useDrawModeStore(s => s.drawMode);
  
  // Transições para operações não-críticas
  const [isPending, startTransition] = useTransition();
  
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
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tamanho base do grid
  const BASE_TILE_SIZE = 32;
  const GRID_TILE_SIZE = BASE_TILE_SIZE * zoomLevel;

  // Memoizar bounds do mapa para evitar recálculos desnecessários
  const mapBounds = useMemo(() => {
    return getMapBounds();
  }, [tileMap.layers, getMapBounds]);

  // Calcular tamanho do container baseado no conteúdo real
  const containerSize = useMemo(() => {
    const bounds = mapBounds;
    const baseSize = 1000000; // Tamanho mínimo
    
    if (bounds.width <= 1 && bounds.height <= 1) {
      return { width: baseSize, height: baseSize };
    }
    
    // Calcular tamanho baseado no conteúdo real + margem
    const contentWidth = bounds.width * GRID_TILE_SIZE;
    const contentHeight = bounds.height * GRID_TILE_SIZE;
    const margin = Math.max(viewport.width * 2, viewport.height * 2, 1000);
    
    return {
      width: Math.max(baseSize, contentWidth + margin),
      height: Math.max(baseSize, contentHeight + margin)
    };
  }, [mapBounds, GRID_TILE_SIZE, viewport.width, viewport.height]);

  // Função para limitar scroll aos limites do grid
  const clampScroll = useCallback((x: number, y: number) => {
    // Usar o tamanho do container calculado
    const maxScrollX = Math.max(0, containerSize.width - viewport.width);
    const maxScrollY = Math.max(0, containerSize.height - viewport.height);
    
    return {
      x: Math.max(0, Math.min(maxScrollX, x)),
      y: Math.max(0, Math.min(maxScrollY, y))
    };
  }, [viewport.width, viewport.height, containerSize.width, containerSize.height]);

  // Função para centralizar o viewport
  const centerOnContent = useCallback(() => {
    if (!containerRef.current) return;
    
    const bounds = mapBounds;
    
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
  }, [mapBounds, viewport.width, viewport.height, GRID_TILE_SIZE, clampScroll]);

  // Função para calcular posição do mouse no grid
  const getMouseGridPosition = useCallback((mouseX: number, mouseY: number) => {
    if (!containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;
    
    const gridX = Math.floor((scrollPosition.x + relativeX) / GRID_TILE_SIZE);
    const gridY = Math.floor((scrollPosition.y + relativeY) / GRID_TILE_SIZE);
    
    return { x: gridX, y: gridY };
  }, [scrollPosition.x, scrollPosition.y, GRID_TILE_SIZE]);

  // Função para desenhar múltiplos tiles selecionados
  const drawMultipleTiles = useCallback((startX: number, startY: number) => {
    if (!selectedTiles.length || !selectionBounds) return;
    
    const tilesWidth = selectionBounds.maxX - selectionBounds.minX + 1;
    
    // Desenhar o padrão de tiles selecionados
    for (let tileIndex = 0; tileIndex < selectedTiles.length; tileIndex++) {
      const tileId = selectedTiles[tileIndex];
      
      // Calcular posição relativa do tile na seleção
      const relativeX = tileIndex % tilesWidth;
      const relativeY = Math.floor(tileIndex / tilesWidth);
      
      // Calcular posição final no canvas
      const canvasX = startX + relativeX;
      const canvasY = startY + relativeY;
      
      placeTile(canvasX, canvasY, tileId);
    }
  }, [selectedTiles, selectionBounds, placeTile]);

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
  }, [placeTile]);

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
  }, [removeTile]);

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

    // Escutar evento customizado para centralizar viewport
    const handleCenterViewport = () => {
      centerOnContent();
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('centerViewportOnMap', handleCenterViewport);
    
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
      window.removeEventListener('centerViewportOnMap', handleCenterViewport);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(initTimer);
    };
  }, [isInitialized, viewport.width, viewport.height, clampScroll, centerOnContent]);

  const handleCellClick = (x: number, y: number, isRightClick: boolean = false) => {
    if (isRightClick) {
      removeTile(x, y);
      setLastErasedCell({ x, y });
    } else if (selectedTiles.length > 1) {
      // Desenhar múltiplos tiles selecionados
      drawMultipleTiles(x, y);
      setLastDrawnCell({ x, y });
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
    } else if (selectedTiles.length > 1) {
      setIsDragging(true);
      setRectSelection({ startX: x, startY: y, endX: x, endY: y });
      drawMultipleTiles(x, y);
      setLastDrawnCell({ x, y });
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
    } else if (isDragging && lastDrawnCell && (lastDrawnCell.x !== x || lastDrawnCell.y !== y)) {
      if (rectSelection && drawMode === 'rectangular') {
        // Atualizar seleção retangular
        setRectSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
        // Desenhar área retangular
        if (selectedTiles.length > 1) {
          // Para múltiplos tiles, desenhar o padrão completo na área retangular
          const minX = Math.min(rectSelection.startX, x);
          const maxX = Math.max(rectSelection.startX, x);
          const minY = Math.min(rectSelection.startY, y);
          const maxY = Math.max(rectSelection.startY, y);
          
          for (let canvasY = minY; canvasY <= maxY; canvasY++) {
            for (let canvasX = minX; canvasX <= maxX; canvasX++) {
              drawMultipleTiles(canvasX, canvasY);
            }
          }
        } else if (activeTile) {
          drawRectangularArea(rectSelection.startX, rectSelection.startY, x, y, activeTile);
        }
      } else {
        if (selectedTiles.length > 1) {
          drawMultipleTiles(x, y);
        } else if (activeTile) {
          placeTile(x, y, activeTile);
        }
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
      
      // Calcular posição do mouse em coordenadas do grid (antes do zoom)
      const gridMouseX = (currentScrollX + mouseX) / GRID_TILE_SIZE;
      const gridMouseY = (currentScrollY + mouseY) / GRID_TILE_SIZE;
      
      // Calcular novo GRID_TILE_SIZE após o zoom
      const newGridTileSize = BASE_TILE_SIZE * newZoom;
      
      // Calcular nova posição de scroll para manter o mouse no mesmo ponto do grid
      const newScrollX = (gridMouseX * newGridTileSize) - mouseX;
      const newScrollY = (gridMouseY * newGridTileSize) - mouseY;
      
      // Atualizar o zoom primeiro
      setZoomLevel(newZoom);
      
      // Aplicar o novo scroll com limites usando requestAnimationFrame para melhor performance
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const clamped = clampScroll(newScrollX, newScrollY);
          containerRef.current.scrollLeft = clamped.x;
          containerRef.current.scrollTop = clamped.y;
        }
      });
    }
  };

  // Otimização: Event listeners com throttling avançado e RAF
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastMouseMoveTime = 0;
    const THROTTLE_MS = 4; // ~240fps para máxima responsividade
    const SCROLL_THROTTLE_MS = 8; // ~120fps para scroll

    const handleGlobalMouseUp = () => {
      startTransition(() => {
        setIsDragging(false);
        setIsErasing(false);
        setIsPanning(false);
        setLastDrawnCell(null);
        setLastErasedCell(null);
        setPanStart(null);
        setRectSelection(null);
      });
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      
      // Throttling diferenciado para diferentes operações
      const throttleTime = isPanning ? SCROLL_THROTTLE_MS : THROTTLE_MS;
      if (now - lastMouseMoveTime < throttleTime) return;
      lastMouseMoveTime = now;

      // Cancelar frame anterior se existir
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        // Panning otimizado com RAF
        if (isPanning && panStart && containerRef.current && !isDragging && !isErasing) {
          const deltaX = panStart.x - e.clientX;
          const deltaY = panStart.y - e.clientY;
          
          const newScrollX = panStart.scrollX + deltaX;
          const newScrollY = panStart.scrollY + deltaY;
          
          const clamped = clampScroll(newScrollX, newScrollY);
          
          // Usar scrollTo com smooth para melhor performance
          containerRef.current.scrollTo({
            left: clamped.x,
            top: clamped.y,
            behavior: 'auto' // Usar 'auto' para melhor performance
          });
        }
        
        // Preview otimizado com throttling
        if (!isPanning && !isDragging && !isErasing && containerRef.current && (selectedTiles.length > 0 || activeTile)) {
          const gridPos = getMouseGridPosition(e.clientX, e.clientY);
          if (gridPos) {
            startTransition(() => {
              setMousePosition(gridPos);
              setShowPreview(true);
            });
          }
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+G (macOS) / Ctrl+G (Windows/Linux) para centralizar
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        centerOnContent();
      }
    };

    const handleMouseLeave = () => {
      setShowPreview(false);
      setMousePosition(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      if (container) {
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPanning, panStart, isDragging, isErasing, clampScroll, centerOnContent, drawMode, getMouseGridPosition]);

  // Remover monitoramento de performance por enquanto

  // Otimização: Virtualização inteligente com adaptive buffering
  const visibleCells = useMemo(() => {
    // Garantir que as células sejam alinhadas com o grid
    const startX = Math.floor(scrollPosition.x / GRID_TILE_SIZE);
    const startY = Math.floor(scrollPosition.y / GRID_TILE_SIZE);
    
    // Buffer adaptativo baseado no zoom level
    const baseBuffer = zoomLevel > 2 ? 0 : zoomLevel > 1 ? 1 : 2;
    const visibleCols = Math.ceil(viewport.width / GRID_TILE_SIZE) + baseBuffer;
    const visibleRows = Math.ceil(viewport.height / GRID_TILE_SIZE) + baseBuffer;
    
    // Limite dinâmico baseado na performance
    const maxCells = zoomLevel > 2 ? 1000 : zoomLevel > 1 ? 1500 : 2500;
    const totalCells = visibleCols * visibleRows;
    
    if (totalCells > maxCells) {
      // Scaling inteligente para manter aspect ratio
      const scale = Math.sqrt(maxCells / totalCells);
      const limitedCols = Math.max(1, Math.floor(visibleCols * scale));
      const limitedRows = Math.max(1, Math.floor(visibleRows * scale));
      
      const cells = [];
      for (let y = startY; y < startY + limitedRows; y++) {
        for (let x = startX; x < startX + limitedCols; x++) {
          cells.push({ x, y });
        }
      }
      return cells;
    }

    // Usar Array.from para melhor performance
    const cells = [];
    for (let y = startY; y < startY + visibleRows; y++) {
      for (let x = startX; x < startX + visibleCols; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, [scrollPosition.x, scrollPosition.y, viewport.width, viewport.height, GRID_TILE_SIZE, zoomLevel]);

  // Memoizar cálculos de escala para evitar recálculos desnecessários
  const tileScale = useMemo(() => ({
    x: GRID_TILE_SIZE / tileSize.width,
    y: GRID_TILE_SIZE / tileSize.height
  }), [GRID_TILE_SIZE, tileSize.width, tileSize.height]);

  // Função para renderizar preview dos tiles selecionados
  const renderPreviewTiles = useCallback((startX: number, startY: number) => {
    if (!selectedTiles.length || !selectionBounds || !tileset) return null;
    
    const tilesWidth = selectionBounds.maxX - selectionBounds.minX + 1;
    
    const previewTiles = [];
    
    for (let tileIndex = 0; tileIndex < selectedTiles.length; tileIndex++) {
      const tileId = selectedTiles[tileIndex];
      
      // Calcular posição relativa do tile na seleção
      const relativeX = tileIndex % tilesWidth;
      const relativeY = Math.floor(tileIndex / tilesWidth);
      
      // Calcular posição final no canvas
      const canvasX = startX + relativeX;
      const canvasY = startY + relativeY;
      
      // Extrair coordenadas x, y do tileId (formato: "x_y")
      const [tileX, tileY] = tileId.split('_').map(Number);
      
      previewTiles.push(
        <div
          key={`preview-${tileIndex}`}
          style={{
            position: 'absolute',
            left: canvasX * GRID_TILE_SIZE,
            top: canvasY * GRID_TILE_SIZE,
            width: GRID_TILE_SIZE,
            height: GRID_TILE_SIZE,
            backgroundImage: `url(${tileset.src})`,
            backgroundPosition: `-${tileX * tileSize.width * tileScale.x}px -${tileY * tileSize.height * tileScale.y}px`,
            backgroundSize: `${tileset.width * tileScale.x}px ${tileset.height * tileScale.y}px`,
            imageRendering: 'pixelated',
            opacity: 0.7,
            border: '1px dashed rgba(0, 255, 0, 0.8)',
            pointerEvents: 'none',
            zIndex: 1500,
          }}
        />
      );
    }
    
    return previewTiles;
  }, [selectedTiles, selectionBounds, tileset, GRID_TILE_SIZE, tileSize, tileScale]);

  // Sistema de cache básico
  const tileCache = useRef(new Map<string, React.ReactNode>());
  const MAX_CACHE_SIZE = 1000;
  
  const renderTile = useCallback((cell: string | null) => {
    if (!cell || !tileset) return null;
    
    // Cache key básico
    const cacheKey = `${cell}_${GRID_TILE_SIZE}_${tileScale.x}_${tileScale.y}`;
    
    // Verificar cache
    if (tileCache.current.has(cacheKey)) {
      return tileCache.current.get(cacheKey);
    }
    
    // Extrair coordenadas x, y do tileId (formato: "x_y")
    const [tileX, tileY] = cell.split('_').map(Number);
    
    // Memoizar elemento com React.memo interno
    const tileElement = (
      <div
        key={`${tileX}_${tileY}`}
        style={{
          width: GRID_TILE_SIZE,
          height: GRID_TILE_SIZE,
          backgroundImage: `url(${tileset.src})`,
          backgroundPosition: `-${tileX * tileSize.width * tileScale.x}px -${tileY * tileSize.height * tileScale.y}px`,
          backgroundSize: `${tileset.width * tileScale.x}px ${tileset.height * tileScale.y}px`,
          imageRendering: 'pixelated',
          willChange: 'transform', // Otimização para GPU
        }}
      />
    );
    
    // LRU Cache com eviction inteligente
    if (tileCache.current.size >= MAX_CACHE_SIZE) {
      const firstKey = tileCache.current.keys().next().value;
      if (firstKey) {
        tileCache.current.delete(firstKey);
      }
    }
    
    tileCache.current.set(cacheKey, tileElement);
    return tileElement;
  }, [tileset, GRID_TILE_SIZE, tileSize.width, tileSize.height, tileScale]);

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
        {selectedTiles.length > 1 && ` (${selectedTiles.length} tiles)`}
      </div>

      {/* Indicador de navegação */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        <span className="text-xs">Use o botão do meio do mouse para navegar</span>
      </div>

      {/* Debug básico */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-50">
        <div className="text-xs">
          <div>Grid: {GRID_TILE_SIZE}px | Zoom: {Math.round(zoomLevel * 100)}%</div>
          <div>Scroll: {Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)}</div>
          <div>Viewport: {viewport.width}x{viewport.height}</div>
          <div>Cells: {visibleCells.length}</div>
          <div>Cache: {tileCache.current.size}/{MAX_CACHE_SIZE}</div>
          {isPending && <div className="text-custom-color">Updating...</div>}
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
            width: `${containerSize.width}px`,
            height: `${containerSize.height}px`
          }}
        >
          {/* Grid de fundo - apenas células visíveis */}
          <BackgroundGrid 
            visibleCells={visibleCells}
            GRID_TILE_SIZE={GRID_TILE_SIZE}
          />

          {/* Renderizar layers */}
          {tileMap.layers.map((layer, layerIndex) => (
            layer.visible && (
              <LayerRenderer
                key={layer.id}
                layer={layer}
                layerIndex={layerIndex}
                totalLayers={tileMap.layers.length}
                GRID_TILE_SIZE={GRID_TILE_SIZE}
                renderTile={renderTile}
              />
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

          {/* Preview dos tiles selecionados */}
          {showPreview && mousePosition && (selectedTiles.length > 0 || activeTile) && !isDragging && !isErasing && !isPanning && (
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1500, pointerEvents: 'none' }}>
              {selectedTiles.length > 1 ? (
                renderPreviewTiles(mousePosition.x, mousePosition.y)
              ) : activeTile ? (
                <div
                  style={{
                    position: 'absolute',
                    left: mousePosition.x * GRID_TILE_SIZE,
                    top: mousePosition.y * GRID_TILE_SIZE,
                    width: GRID_TILE_SIZE,
                    height: GRID_TILE_SIZE,
                    backgroundImage: `url(${tileset?.src})`,
                    backgroundPosition: `-${parseInt(activeTile.split('_')[0]) * tileSize.width * tileScale.x}px -${parseInt(activeTile.split('_')[1]) * tileSize.height * tileScale.y}px`,
                    backgroundSize: `${(tileset?.width || 0) * tileScale.x}px ${(tileset?.height || 0) * tileScale.y}px`,
                    imageRendering: 'pixelated',
                    opacity: 0.7,
                    border: '1px dashed rgba(0, 255, 0, 0.8)',
                    pointerEvents: 'none',
                  }}
                />
              ) : null}
            </div>
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
                  } else if ((activeTile || selectedTiles.length > 0) && e.buttons !== 2) {
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
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
