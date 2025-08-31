import { useRef } from 'react';
import { useTilesetStore } from '../../hooks/useTileset';
import { Upload } from '@nsmr/pixelart-react';

export default function TilesetLoader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const tileset = useTilesetStore(s => s.tileset);
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
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className="border-dashed border-2 border-custom-light-gray rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px] bg-custom-medium-gray w-full cursor-pointer hover:border-custom-color transition-colors"
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
          <div className="text-center">
            <img src={tileset.src} alt="Tileset" className="max-h-20 mb-2 mx-auto rounded border border-custom-light-gray" />
            <span className="text-sm text-custom-light-gray">Tileset carregado</span>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <span className="text-sm text-custom-light-gray">Arraste uma imagem de tileset ou clique para selecionar</span>
          </div>
        )}
      </div>
    </div>
  );
}
