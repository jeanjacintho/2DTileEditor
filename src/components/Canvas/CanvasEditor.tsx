import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const activeTile = useTilesetStore(s => s.activeTile);

  function handleCellClick(x: number, y: number) {
    if (activeTile != null) placeTile(x, y, activeTile);
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
          }}
        >
          {tileMap.layers[0].data.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className="border border-gray-200 w-full h-full cursor-pointer relative"
                style={{ width: tileMap.tileSize, height: tileMap.tileSize, background: cell != null && tileset ? `url(${tileset.src})` : undefined, backgroundPosition: cell != null && tileset ? `-${cell * tileSize.width}px 0` : undefined, backgroundSize: tileset ? `${tileset.width}px ${tileset.height}px` : undefined }}
                onClick={() => handleCellClick(x, y)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
