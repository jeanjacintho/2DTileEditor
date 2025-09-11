// Configurações de performance para o 2D Tile Editor
export const PERFORMANCE_CONFIG = {
  // Configurações de cache
  CACHE: {
    MAX_TILE_CACHE_SIZE: 2000,
    MAX_LAYER_CACHE_SIZE: 100,
    CACHE_CLEANUP_INTERVAL: 30000, // 30 segundos
  },
  
  // Configurações de renderização
  RENDERING: {
    MAX_VISIBLE_CELLS: {
      ZOOM_LEVEL_1: 2500,
      ZOOM_LEVEL_2: 1500,
      ZOOM_LEVEL_3: 1000,
    },
    BUFFER_SIZE: {
      ZOOM_LEVEL_1: 2,
      ZOOM_LEVEL_2: 1,
      ZOOM_LEVEL_3: 0,
    },
    USE_GPU_ACCELERATION: true,
    ENABLE_WILL_CHANGE: true,
  },
  
  // Configurações de eventos
  EVENTS: {
    MOUSE_THROTTLE_MS: 4, // ~240fps
    SCROLL_THROTTLE_MS: 8, // ~120fps
    WHEEL_THROTTLE_MS: 16, // ~60fps
    ENABLE_REQUEST_ANIMATION_FRAME: true,
  },
  
  // Configurações de monitoramento
  MONITORING: {
    ENABLED: true,
    SAMPLE_RATE_MS: 1000,
    MAX_SAMPLES: 60,
    ENABLE_MEMORY_MONITORING: true,
    ENABLE_FPS_MONITORING: true,
  },
  
  // Configurações de otimização
  OPTIMIZATION: {
    ENABLE_BATCH_OPERATIONS: true,
    ENABLE_LAZY_LOADING: true,
    ENABLE_VIRTUALIZATION: true,
    ENABLE_MEMOIZATION: true,
    ENABLE_TRANSITIONS: true,
  },
  
  // Configurações de debug
  DEBUG: {
    SHOW_PERFORMANCE_STATS: true,
    SHOW_CACHE_STATS: true,
    SHOW_RENDER_STATS: true,
    ENABLE_CONSOLE_LOGGING: false,
  }
} as const;

// Função para obter configurações baseadas no zoom level
export const getPerformanceConfig = (zoomLevel: number) => {
  const config = PERFORMANCE_CONFIG.RENDERING;
  
  if (zoomLevel >= 3) {
    return {
      maxVisibleCells: config.MAX_VISIBLE_CELLS.ZOOM_LEVEL_3,
      bufferSize: config.BUFFER_SIZE.ZOOM_LEVEL_3,
    };
  } else if (zoomLevel >= 2) {
    return {
      maxVisibleCells: config.MAX_VISIBLE_CELLS.ZOOM_LEVEL_2,
      bufferSize: config.BUFFER_SIZE.ZOOM_LEVEL_2,
    };
  } else {
    return {
      maxVisibleCells: config.MAX_VISIBLE_CELLS.ZOOM_LEVEL_1,
      bufferSize: config.BUFFER_SIZE.ZOOM_LEVEL_1,
    };
  }
};

// Função para verificar se as otimizações estão habilitadas
export const isOptimizationEnabled = (feature: keyof typeof PERFORMANCE_CONFIG.OPTIMIZATION) => {
  return PERFORMANCE_CONFIG.OPTIMIZATION[feature];
};

// Função para verificar se o debug está habilitado
export const isDebugEnabled = (feature: keyof typeof PERFORMANCE_CONFIG.DEBUG) => {
  return PERFORMANCE_CONFIG.DEBUG[feature];
};
