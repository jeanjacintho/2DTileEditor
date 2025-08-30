import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const tileSize = useTilesetStore(s => s.tileSize);

  function handleCellClick(x: number, y: number) {
    if (activeTile != null) {
      console.log('Placing tile:', activeTile, 'at position:', x, y);
      placeTile(x, y, activeTile);
    }
  }

  function renderTile(cell: string | null) {
    if (!cell || !tileset) return null;
    
    // Parse tile coordinates from cell ID (format: "x_y")
    const [x, y] = cell.split('_').map(Number);
    if (isNaN(x) || isNaN(y)) return null;

    return {
      x: x * tileSize.width,
      y: y * tileSize.height,
      width: tileSize.width,
      height: tileSize.height,
    };
  }

  return (
    <main className="flex-1 h-full w-full bg-white overflow-auto">
      <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tileMap.width}, ${tileMap.tileSize}px)`,
            gridTemplateRows: `repeat(${tileMap.height}, ${tileMap.tileSize}px)`,
            border: '1px solid #ddd',
            width: tileMap.width * tileMap.tileSize,
            height: tileMap.height * tileMap.tileSize,
            maxWidth: '100%',
            maxHeight: '100%',
            position: 'relative',
          }}
        >
          {/* Render all visible layers */}
          {tileMap.layers.map((layer, layerIndex) => (
            layer.visible && (
              <div
                key={layer.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${tileMap.width}, ${tileMap.tileSize}px)`,
                  gridTemplateRows: `repeat(${tileMap.height}, ${tileMap.tileSize}px)`,
                  zIndex: tileMap.layers.length - layerIndex, // Invert zIndex so first layers are on top
                  pointerEvents: 'none', // Allow clicks to pass through to base layer
                }}
              >
                {layer.data.map((row, y) =>
                  row.map((cell, x) => {
                    const tile = renderTile(cell);
                    const scaleX = tile ? tileMap.tileSize / tile.width : 1;
                    const scaleY = tile ? tileMap.tileSize / tile.height : 1;
                    
                    return (
                      <div
                        key={`${layer.id}-${x}-${y}`}
                        className="w-full h-full relative"
                        style={{
                          width: tileMap.tileSize,
                          height: tileMap.tileSize,
                          background: tile && tileset ? `url(${tileset.src})` : undefined,
                          backgroundPosition: tile && tileset ? `-${tile.x * scaleX}px -${tile.y * scaleY}px` : undefined,
                          backgroundSize: tileset ? `${tileset.width * scaleX}px ${tileset.height * scaleY}px` : undefined,
                          imageRendering: 'pixelated',
                        }}
                      />
                    );
                  })
                )}
              </div>
            )
          ))}

          {/* Clickable grid overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${tileMap.width}, ${tileMap.tileSize}px)`,
              gridTemplateRows: `repeat(${tileMap.height}, ${tileMap.tileSize}px)`,
              zIndex: 1000,
            }}
          >
            {Array.from({ length: tileMap.height }, (_, y) =>
              Array.from({ length: tileMap.width }, (_, x) => (
                <div
                  key={`click-${x}-${y}`}
                  className="border border-gray-200 w-full h-full cursor-pointer relative hover:bg-blue-50/30"
                  style={{
                    width: tileMap.tileSize,
                    height: tileMap.tileSize,
                  }}
                  onClick={() => handleCellClick(x, y)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
