import { useRef } from 'react';
import { useTilesetStore } from '../../hooks/useTileset';

export default function TilesetLoader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const tileset = useTilesetStore(s => s.tileset);
  const tileSize = useTilesetStore(s => s.tileSize);
  const setTileSize = useTilesetStore(s => s.setTileSize);
  const loadTileset = useTilesetStore(s => s.loadTileset);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadTileset(e.dataTransfer.files[0]);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      loadTileset(e.target.files[0]);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div
        className="border-dashed border-2 border-gray-300 rounded p-4 flex flex-col items-center justify-center min-h-[120px] bg-white w-full cursor-pointer"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
      >
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={handleFile}
        />
        {tileset ? (
          <img src={tileset.src} alt="Tileset" className="max-h-32 mb-2" />
        ) : (
          <span>Arraste uma imagem de tileset ou clique para selecionar</span>
        )}
      </div>
      <div className="flex gap-2 mt-2 w-full justify-center">
        <label className="flex items-center gap-1">
          Largura
          <input
            type="number"
            min={1}
            value={tileSize.width}
            onChange={e => setTileSize({ ...tileSize, width: Number(e.target.value) })}
            className="w-16 border rounded px-1 bg-transparent"
          />
        </label>
        <label className="flex items-center gap-1">
          Altura
          <input
            type="number"
            min={1}
            value={tileSize.height}
            onChange={e => setTileSize({ ...tileSize, height: Number(e.target.value) })}
            className="w-16 border rounded px-1 bg-transparent"
          />
        </label>
      </div>
    </div>
  );
}
