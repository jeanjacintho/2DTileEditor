import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function CanvasEditor() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const placeTile = useTileMapStore(s => s.placeTile);
  const tileset = useTilesetStore(s => s.tileset);
  const activeTile = useTilesetStore(s => s.activeTile);
  const tiles = useTilesetStore(s => s.tiles);

  function handleCellClick(x: number, y: number) {
    if (activeTile != null) {
      console.log('Placing tile:', activeTile, 'at position:', x, y);
      placeTile(x, y, activeTile);
    }
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
            row.map((cell, x) => {
              const tile = tiles.find(t => t.id === cell);
              if (cell && tile) {
                console.log('Rendering cell:', cell, 'found tile:', tile, 'bg-position:', `-${tile.x}px -${tile.y}px`);
              }
              const scaleX = tile ? tileMap.tileSize / tile.width : 1;
              const scaleY = tile ? tileMap.tileSize / tile.height : 1;
              return (
                <div
                  key={`${x}-${y}`}
                  className="border border-gray-200 w-full h-full cursor-pointer relative"
                  style={{
                    width: tileMap.tileSize,
                    height: tileMap.tileSize,
                    background: tile && tileset ? `url(${tileset.src})` : undefined,
                    backgroundPosition: tile && tileset ? `-${tile.x * scaleX}px -${tile.y * scaleY}px` : undefined,
                    backgroundSize: tileset ? `${tileset.width * scaleX}px ${tileset.height * scaleY}px` : undefined,
                    imageRendering: 'pixelated',
                  }}
                  onClick={() => handleCellClick(x, y)}
                />
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
