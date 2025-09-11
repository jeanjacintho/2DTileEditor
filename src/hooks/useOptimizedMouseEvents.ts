import { useCallback, useRef, useEffect } from 'react';

interface MouseEventConfig {
  throttleMs?: number;
  scrollThrottleMs?: number;
  enableRAF?: boolean;
}

interface MousePosition {
  x: number;
  y: number;
}

interface MouseEventHandlers {
  onMouseMove?: (e: MouseEvent, position: MousePosition) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent, position: MousePosition) => void;
  onWheel?: (e: WheelEvent) => void;
}

// Hook otimizado para eventos de mouse com throttling avançado e RAF
export const useOptimizedMouseEvents = (
  config: MouseEventConfig = {},
  handlers: MouseEventHandlers = {}
) => {
  const {
    throttleMs = 4, // ~240fps para máxima responsividade
    scrollThrottleMs = 8, // ~120fps para scroll
    enableRAF = true
  } = config;

  const animationFrameRef = useRef<number | null>(null);
  const lastMouseMoveTime = useRef(0);
  const lastScrollTime = useRef(0);
  const isPanningRef = useRef(false);

  // Função para calcular posição do mouse no grid
  const getMouseGridPosition = useCallback((mouseX: number, mouseY: number, containerRect: DOMRect, scrollPosition: MousePosition, gridTileSize: number): MousePosition | null => {
    const relativeX = mouseX - containerRect.left;
    const relativeY = mouseY - containerRect.top;
    
    const gridX = Math.floor((scrollPosition.x + relativeX) / gridTileSize);
    const gridY = Math.floor((scrollPosition.y + relativeY) / gridTileSize);
    
    return { x: gridX, y: gridY };
  }, []);

  // Handler otimizado para mouse move com throttling diferenciado
  const handleMouseMove = useCallback((e: MouseEvent, scrollPosition: MousePosition, containerRect: DOMRect, gridTileSize: number) => {
    const now = Date.now();
    const throttleTime = isPanningRef.current ? scrollThrottleMs : throttleMs;
    
    if (now - lastMouseMoveTime.current < throttleTime) return;
    lastMouseMoveTime.current = now;

    if (enableRAF) {
      // Cancelar frame anterior se existir
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const position = getMouseGridPosition(e.clientX, e.clientY, containerRect, scrollPosition, gridTileSize);
        if (position && handlers.onMouseMove) {
          handlers.onMouseMove(e, position);
        }
      });
    } else {
      const position = getMouseGridPosition(e.clientX, e.clientY, containerRect, scrollPosition, gridTileSize);
      if (position && handlers.onMouseMove) {
        handlers.onMouseMove(e, position);
      }
    }
  }, [throttleMs, scrollThrottleMs, enableRAF, getMouseGridPosition, handlers.onMouseMove]);

  // Handler otimizado para wheel com throttling
  const handleWheel = useCallback((e: WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < scrollThrottleMs) return;
    lastScrollTime.current = now;

    if (enableRAF) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (handlers.onWheel) {
          handlers.onWheel(e);
        }
      });
    } else {
      if (handlers.onWheel) {
        handlers.onWheel(e);
      }
    }
  }, [scrollThrottleMs, enableRAF, handlers.onWheel]);

  // Handler para mouse up
  const handleMouseUp = useCallback((e: MouseEvent) => {
    isPanningRef.current = false;
    if (handlers.onMouseUp) {
      handlers.onMouseUp(e);
    }
  }, [handlers.onMouseUp]);

  // Handler para mouse down
  const handleMouseDown = useCallback((e: MouseEvent, containerRect: DOMRect, scrollPosition: MousePosition, gridTileSize: number) => {
    if (e.button === 1) { // Middle mouse button
      isPanningRef.current = true;
    }
    
    const position = getMouseGridPosition(e.clientX, e.clientY, containerRect, scrollPosition, gridTileSize);
    if (position && handlers.onMouseDown) {
      handlers.onMouseDown(e, position);
    }
  }, [getMouseGridPosition, handlers.onMouseDown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    handleMouseMove,
    handleMouseUp,
    handleMouseDown,
    handleWheel,
    getMouseGridPosition,
    isPanning: isPanningRef.current
  };
};

// Hook para debouncing de operações custosas
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Hook para throttling de operações frequentes
export const useThrottledCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef(0);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;

  return throttledCallback;
};
