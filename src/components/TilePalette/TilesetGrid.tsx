import { Upload } from '@nsmr/pixelart-react';
import { useTilesetStore } from '../../hooks/useTileset';

const TILE_DISPLAY_SIZE = 32; // Tamanho menor para mostrar mais tiles

export default function TilesetGrid() {
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const activeTile = useTilesetStore(s => s.activeTile);
  const selectTileFromGrid = useTilesetStore(s => s.selectTileFromGrid);

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-custom-white">Tileset Grid</div>
      {tileset ? (
        <div className="border border-custom-light-gray bg-custom-pure-black overflow-auto" style={{ maxHeight: '300px' }}>
          <div 
            className="relative"
            style={{
              width: Math.floor(tileset.width / tileSize.width) * TILE_DISPLAY_SIZE,
              height: Math.floor(tileset.height / tileSize.height) * TILE_DISPLAY_SIZE,
              backgroundImage: `
                url(${tileset.src}),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `
                ${Math.floor(tileset.width / tileSize.width) * TILE_DISPLAY_SIZE}px ${Math.floor(tileset.height / tileSize.height) * TILE_DISPLAY_SIZE}px,
                ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px,
                ${TILE_DISPLAY_SIZE}px ${TILE_DISPLAY_SIZE}px
              `,
              backgroundRepeat: 'no-repeat, repeat, repeat',
              backgroundPosition: '0 0, 0 0, 0 0',
              imageRendering: 'pixelated',
            }}
          >
            {/* Grid clicável sem bordas */}
            <div 
              className="absolute inset-0"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.floor(tileset.width / tileSize.width)}, ${TILE_DISPLAY_SIZE}px)`,
                gridTemplateRows: `repeat(${Math.floor(tileset.height / tileSize.height)}, ${TILE_DISPLAY_SIZE}px)`,
              }}
            >
              {Array.from({ length: Math.floor(tileset.height / tileSize.height) }, (_, y) =>
                Array.from({ length: Math.floor(tileset.width / tileSize.width) }, (_, x) => {
                  const tileId = `${x}_${y}`;
                  const isActive = activeTile === tileId;
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`cursor-pointer border border-transparent hover:border-custom-color hover:bg-custom-color/20 transition-colors ${
                        isActive ? 'border-custom-color bg-custom-color/30' : ''
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
                          <div className="w-3 h-3 bg-custom-color rounded-full opacity-80"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-custom-light-gray bg-custom-pure-black h-48 flex items-center justify-center text-custom-light-gray">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-2xl mb-2"><Upload size={24} /></div>
            <div className="text-sm">No tileset loaded</div>
            <div className="text-xs mt-1">Click "Import Tileset" to load an image</div>
          </div>
        </div>
      )}
      
      {/* Informações do tile selecionado */}
      {activeTile && (
        <div className="mt-2 p-2 bg-custom-black border border-custom-light-gray text-xs text-custom-white">
          <div className="font-medium">Selected Tile: {activeTile}</div>
          <div className="text-custom-light-gray">Size: {tileSize.width} x {tileSize.height}</div>
        </div>
      )}
    </div>
  );
}
