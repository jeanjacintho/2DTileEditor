import { useRef, useCallback, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  memoryUsage?: number;
  cacheHitRate: number;
  visibleCells: number;
  totalTiles: number;
}

interface PerformanceMonitorConfig {
  enabled?: boolean;
  sampleRate?: number; // ms
  maxSamples?: number;
}

// Hook para monitoramento de performance em tempo real
export const usePerformanceMonitor = (config: PerformanceMonitorConfig = {}) => {
  const {
    enabled = true,
    sampleRate = 1000, // 1 segundo
    maxSamples = 60 // 1 minuto de dados
  } = config;

  const metricsRef = useRef<PerformanceMetrics[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastSampleTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Função para calcular FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    
    if (deltaTime >= sampleRate) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      const frameTime = deltaTime / frameCountRef.current;
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      return { fps, frameTime };
    }
    
    return null;
  }, [sampleRate]);

  // Função para obter uso de memória (se disponível)
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      };
    }
    return null;
  }, []);

  // Função para medir tempo de renderização
  const measureRenderTime = useCallback((renderFunction: () => void) => {
    const start = performance.now();
    renderFunction();
    const end = performance.now();
    return end - start;
  }, []);

  // Função para atualizar métricas
  const updateMetrics = useCallback((additionalMetrics: Partial<PerformanceMetrics>) => {
    if (!enabled) return;

    const now = performance.now();
    if (now - lastSampleTimeRef.current >= sampleRate) {
      const fpsData = calculateFPS();
      const memoryData = getMemoryUsage();
      
      if (fpsData) {
        const metrics: PerformanceMetrics = {
          fps: fpsData.fps,
          frameTime: fpsData.frameTime,
          renderTime: 0, // Será preenchido quando necessário
          memoryUsage: memoryData?.used,
          cacheHitRate: 0, // Será preenchido externamente
          visibleCells: 0, // Será preenchido externamente
          totalTiles: 0, // Será preenchido externamente
          ...additionalMetrics
        };

        metricsRef.current.push(metrics);
        
        // Manter apenas os últimos maxSamples
        if (metricsRef.current.length > maxSamples) {
          metricsRef.current.shift();
        }
        
        lastSampleTimeRef.current = now;
      }
    }
  }, [enabled, sampleRate, maxSamples, calculateFPS, getMemoryUsage]);

  // Função para incrementar contador de frames
  const incrementFrameCount = useCallback(() => {
    frameCountRef.current++;
  }, []);

  // Função para obter estatísticas atuais
  const getCurrentStats = useCallback(() => {
    if (metricsRef.current.length === 0) {
      return {
        avgFPS: 0,
        avgFrameTime: 0,
        avgRenderTime: 0,
        avgMemoryUsage: 0,
        avgCacheHitRate: 0,
        avgVisibleCells: 0,
        avgTotalTiles: 0,
        minFPS: 0,
        maxFPS: 0
      };
    }

    const latest = metricsRef.current[metricsRef.current.length - 1];
    const avgFPS = metricsRef.current.reduce((sum, m) => sum + m.fps, 0) / metricsRef.current.length;
    const avgFrameTime = metricsRef.current.reduce((sum, m) => sum + m.frameTime, 0) / metricsRef.current.length;
    const avgRenderTime = metricsRef.current.reduce((sum, m) => sum + m.renderTime, 0) / metricsRef.current.length;
    const avgMemoryUsage = metricsRef.current.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / metricsRef.current.length;
    const avgCacheHitRate = metricsRef.current.reduce((sum, m) => sum + m.cacheHitRate, 0) / metricsRef.current.length;
    const avgVisibleCells = metricsRef.current.reduce((sum, m) => sum + m.visibleCells, 0) / metricsRef.current.length;
    const avgTotalTiles = metricsRef.current.reduce((sum, m) => sum + m.totalTiles, 0) / metricsRef.current.length;
    
    const minFPS = Math.min(...metricsRef.current.map(m => m.fps));
    const maxFPS = Math.max(...metricsRef.current.map(m => m.fps));

    return {
      avgFPS: Math.round(avgFPS),
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage),
      avgCacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
      avgVisibleCells: Math.round(avgVisibleCells),
      avgTotalTiles: Math.round(avgTotalTiles),
      minFPS,
      maxFPS,
      latest
    };
  }, []);

  // Função para limpar métricas
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
    lastSampleTimeRef.current = performance.now();
  }, []);

  // Função para exportar métricas
  const exportMetrics = useCallback(() => {
    const stats = getCurrentStats();
    const data = {
      timestamp: new Date().toISOString(),
      stats,
      rawMetrics: metricsRef.current
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [getCurrentStats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    updateMetrics,
    incrementFrameCount,
    measureRenderTime,
    getCurrentStats,
    clearMetrics,
    exportMetrics,
    metrics: metricsRef.current
  };
};

// Hook para monitoramento de cache
export const useCacheMonitor = () => {
  const statsRef = useRef({ hits: 0, misses: 0, evictions: 0 });

  const recordHit = useCallback(() => {
    statsRef.current.hits++;
  }, []);

  const recordMiss = useCallback(() => {
    statsRef.current.misses++;
  }, []);

  const recordEviction = useCallback(() => {
    statsRef.current.evictions++;
  }, []);

  const getHitRate = useCallback(() => {
    const total = statsRef.current.hits + statsRef.current.misses;
    return total > 0 ? (statsRef.current.hits / total) * 100 : 0;
  }, []);

  const resetStats = useCallback(() => {
    statsRef.current = { hits: 0, misses: 0, evictions: 0 };
  }, []);

  return {
    recordHit,
    recordMiss,
    recordEviction,
    getHitRate,
    resetStats,
    stats: statsRef.current
  };
};
