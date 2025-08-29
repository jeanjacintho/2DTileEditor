import TilesetLoader from '../TilesetLoader/TilesetLoader';
import { useTilesetStore } from '../../hooks/useTileset';

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
      <div className="flex-1 overflow-auto mt-2 grid grid-cols-4 gap-1">
        {tiles.map(tile => (
          <div
            key={tile.id}
            className={`w-12 h-12 border ${activeTile === tile.id ? 'border-blue-500' : 'border-gray-300'} cursor-pointer flex items-center justify-center`}
            onClick={() => setActiveTile(tile.id)}
            style={{
              backgroundImage: tileset ? `url(${tileset.src})` : undefined,
              backgroundPosition: `-${tile.x}px -${tile.y}px`,
              backgroundSize: `${tileset?.width}px ${tileset?.height}px`,
              width: tileSize.width,
              height: tileSize.height,
            }}
          >
            {activeTile === tile.id && (
              <span className="text-xs text-blue-600 font-bold">{tile.id}</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
