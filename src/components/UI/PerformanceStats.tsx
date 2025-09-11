import { memo, useMemo } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useCacheMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceStatsProps {
  visibleCells: number;
  totalTiles: number;
  cacheSize: number;
  maxCacheSize: number;
}

const PerformanceStats = memo(({ 
  visibleCells, 
  totalTiles, 
  cacheSize, 
  maxCacheSize 
}: PerformanceStatsProps) => {
  const { getCurrentStats } = usePerformanceMonitor();
  const { getHitRate } = useCacheMonitor();
  
  const stats = getCurrentStats();
  const cacheHitRate = getHitRate();
  
  // Calcular indicadores de performance
  const performanceIndicators = useMemo(() => {
    const fpsStatus = stats.avgFPS >= 60 ? 'excellent' : 
                     stats.avgFPS >= 30 ? 'good' : 
                     stats.avgFPS >= 15 ? 'fair' : 'poor';
    
    const memoryStatus = stats.avgMemoryUsage < 100 ? 'excellent' :
                        stats.avgMemoryUsage < 200 ? 'good' :
                        stats.avgMemoryUsage < 400 ? 'fair' : 'poor';
    
    const cacheStatus = cacheHitRate >= 80 ? 'excellent' :
                       cacheHitRate >= 60 ? 'good' :
                       cacheHitRate >= 40 ? 'fair' : 'poor';
    
    return { fpsStatus, memoryStatus, cacheStatus };
  }, [stats.avgFPS, stats.avgMemoryUsage, cacheHitRate]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'fair': return 'text-orange-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2 text-sm">Performance Stats</div>
      
      {/* FPS */}
      <div className="mb-1">
        <span className="text-gray-300">FPS:</span>
        <span className={`ml-2 font-mono ${getStatusColor(performanceIndicators.fpsStatus)}`}>
          {stats.avgFPS} ({stats.minFPS}-{stats.maxFPS})
        </span>
      </div>
      
      {/* Frame Time */}
      <div className="mb-1">
        <span className="text-gray-300">Frame Time:</span>
        <span className="ml-2 font-mono text-blue-400">
          {stats.avgFrameTime.toFixed(2)}ms
        </span>
      </div>
      
      {/* Memory Usage */}
      <div className="mb-1">
        <span className="text-gray-300">Memory:</span>
        <span className={`ml-2 font-mono ${getStatusColor(performanceIndicators.memoryStatus)}`}>
          {stats.avgMemoryUsage}MB
        </span>
      </div>
      
      {/* Cache Hit Rate */}
      <div className="mb-1">
        <span className="text-gray-300">Cache Hit Rate:</span>
        <span className={`ml-2 font-mono ${getStatusColor(performanceIndicators.cacheStatus)}`}>
          {cacheHitRate.toFixed(1)}%
        </span>
      </div>
      
      {/* Cache Size */}
      <div className="mb-1">
        <span className="text-gray-300">Cache Size:</span>
        <span className="ml-2 font-mono text-yellow-400">
          {cacheSize}/{maxCacheSize}
        </span>
      </div>
      
      {/* Visible Cells */}
      <div className="mb-1">
        <span className="text-gray-300">Visible Cells:</span>
        <span className="ml-2 font-mono text-purple-400">
          {visibleCells}
        </span>
      </div>
      
      {/* Total Tiles */}
      <div className="mb-1">
        <span className="text-gray-300">Total Tiles:</span>
        <span className="ml-2 font-mono text-cyan-400">
          {totalTiles}
        </span>
      </div>
      
      {/* Performance Bar */}
      <div className="mt-2">
        <div className="text-gray-300 text-xs mb-1">Overall Performance</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              performanceIndicators.fpsStatus === 'excellent' ? 'bg-green-400' :
              performanceIndicators.fpsStatus === 'good' ? 'bg-yellow-400' :
              performanceIndicators.fpsStatus === 'fair' ? 'bg-orange-400' : 'bg-red-400'
            }`}
            style={{ 
              width: `${Math.min(100, Math.max(0, stats.avgFPS / 60 * 100))}%` 
            }}
          />
        </div>
      </div>
      
      {/* Recommendations */}
      {performanceIndicators.fpsStatus === 'poor' && (
        <div className="mt-2 text-xs text-red-400">
          <div className="font-bold">Performance Issues Detected:</div>
          <ul className="list-disc list-inside mt-1">
            {stats.avgFPS < 15 && <li>Consider reducing zoom level</li>}
            {cacheHitRate < 40 && <li>Cache efficiency is low</li>}
            {stats.avgMemoryUsage > 400 && <li>High memory usage detected</li>}
            {visibleCells > 2000 && <li>Too many visible cells</li>}
          </ul>
        </div>
      )}
    </div>
  );
});

PerformanceStats.displayName = 'PerformanceStats';

export default PerformanceStats;
