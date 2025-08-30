import { useTilesetStore } from '../../hooks/useTileset';

const TILE_DISPLAY_SIZE = 32; // Tamanho menor para mostrar mais tiles

export default function TilesetGrid() {
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectTileFromGrid = useTilesetStore(s => s.selectTileFromGrid);

  if (!tileset) return null;

  const cols = Math.floor(tileset.width / tileSize.width);
  const rows = Math.floor(tileset.height / tileSize.height);

  return (
    <div className="flex-1 overflow-auto">
      <div className="text-sm font-medium mb-2 text-gray-700">Tileset Grid</div>
      <div className="border border-gray-300 bg-white overflow-auto" style={{ maxHeight: '400px' }}>
        <div 
          className="relative"
          style={{
            width: cols * TILE_DISPLAY_SIZE,
            height: rows * TILE_DISPLAY_SIZE,
            backgroundImage: `url(${tileset.src})`,
            backgroundSize: `${cols * TILE_DISPLAY_SIZE}px ${rows * TILE_DISPLAY_SIZE}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        >
          {/* Grid overlay para mostrar as células */}
          <div 
            className="absolute inset-0"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${TILE_DISPLAY_SIZE}px)`,
              gridTemplateRows: `repeat(${rows}, ${TILE_DISPLAY_SIZE}px)`,
            }}
          >
            {Array.from({ length: rows }, (_, y) =>
              Array.from({ length: cols }, (_, x) => {
                const tileId = `${x}_${y}`;
                const isActive = activeTile === tileId;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`border cursor-pointer hover:bg-blue-100/50 transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-200/50' : 'border-gray-200'
                    }`}
                    style={{
                      width: TILE_DISPLAY_SIZE,
                      height: TILE_DISPLAY_SIZE,
                    }}
                    onClick={() => selectTileFromGrid(x, y)}
                    title={`Tile ${x},${y}`}
                  >
                    {isActive && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Informações do tile selecionado */}
      {activeTile && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium">Tile Selecionado: {activeTile}</div>
          <div className="text-gray-600">Tamanho: {tileSize.width} x {tileSize.height}</div>
        </div>
      )}
    </div>
  );
}
