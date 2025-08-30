import TilesetLoader from '../TilesetLoader/TilesetLoader';
import TilesetGrid from './TilesetGrid';
import { useTilesetStore } from '../../hooks/useTileset';

export default function TilePalette() {
  const tileset = useTilesetStore(s => s.tileset);

  return (
    <aside className="w-96 bg-gray-50 border-r h-full flex flex-col gap-2 p-2">
      <TilesetLoader />
      
      {tileset && <TilesetGrid />}
    </aside>
  );
}
