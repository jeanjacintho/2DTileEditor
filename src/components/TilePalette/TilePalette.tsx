import TilesetLoader from '../TilesetLoader/TilesetLoader';
import TilesetGrid from './TilesetGrid';
import { useTilesetStore } from '../../hooks/useTileset';
import LayerPanel from '../LayerPanel/LayerPanel';
import Button from '../UI/Button';
import { Upload } from '@nsmr/pixelart-react';

export default function TilePalette() {
  const tileset = useTilesetStore(s => s.tileset);

  return (
    <aside className="w-96 bg-custom-black border-r border-custom-light-gray h-full flex flex-col gap-4 px-4 py-2">
      <div className="text-2xl font-bold h-16 flex items-center">2DTileEditor</div>
      <div className="flex flex-col gap-2">
        <TilesetGrid />
        <Button 
          variant="secondary" 
          icon={Upload}
          onClick={() => document.getElementById('tileset-input')?.click()}
          className="w-full"
        >
          Import Tileset
        </Button>
        <input
          id="tileset-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const loadTileset = useTilesetStore.getState().loadTileset;
              loadTileset(e.target.files[0]);
            }
          }}
        />
      </div>
      <div className="overflow-hidden">
        <LayerPanel />
      </div>
    </aside>
  );
}
