import TilesetLoader from '../TilesetLoader/TilesetLoader';
import { useTilesetStore } from '../../hooks/useTileset';

const TILE_DISPLAY_SIZE = 64;

export default function TilePalette() {
  const tileset = useTilesetStore(s => s.tileset);
  const tiles = useTilesetStore(s => s.tiles);
  const tileSize = useTilesetStore(s => s.tileSize);
  const extractTiles = useTilesetStore(s => s.extractTiles);
  const activeTile = useTilesetStore(s => s.activeTile);
  const setActiveTile = useTilesetStore(s => s.setActiveTile);

  function handleExtract() {
    extractTiles();
  }

  return (
    <aside className="w-64 bg-gray-50 border-r h-full flex flex-col gap-2 p-2">
      <TilesetLoader />
      {tileset && (
        <button className="mt-2 px-2 py-1 bg-blue-500 text-white rounded" onClick={handleExtract}>
          Extrair Tiles
        </button>
      )}
      <div className="flex-1 overflow-auto mt-2 grid grid-cols-3 gap-2">
        {tiles.map(tile => {
          const scaleX = TILE_DISPLAY_SIZE / tile.width;
          const scaleY = TILE_DISPLAY_SIZE / tile.height;
          return (
            <div
              key={tile.id}
              className={`border ${activeTile === tile.id ? 'border-blue-500' : 'border-gray-300'} cursor-pointer flex items-center justify-center relative`}
              style={{
                width: TILE_DISPLAY_SIZE,
                height: TILE_DISPLAY_SIZE,
                backgroundImage: tileset ? `url(${tileset.src})` : undefined,
                backgroundPosition: `-${tile.x * scaleX}px -${tile.y * scaleY}px`,
                backgroundSize: tileset ? `${tileset.width * scaleX}px ${tileset.height * scaleY}px` : undefined,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
              }}
              onClick={() => setActiveTile(tile.id)}
            >
              {activeTile === tile.id && (
                <span className="absolute bottom-1 right-1 text-xs text-blue-600 font-bold bg-white/80 px-1 rounded">{tile.id}</span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
