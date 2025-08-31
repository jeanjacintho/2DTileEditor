import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';
import { Download } from 'lucide-react';

export default function Toolbar() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const undo = useTileMapStore(s => s.undo);
  const redo = useTileMapStore(s => s.redo);
  const exportMap = useTileMapStore(s => s.exportMap);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const activeLayerId = useTileMapStore(s => s.activeLayerId);
  const tileSize = useTilesetStore(s => s.tileSize);
  const setTileSize = useTilesetStore(s => s.setTileSize);
  const [tileSizeValue, setTileSizeValue] = useState(tileSize.width);

  const handleTileSizeChange = (newSize: number) => {
    setTileSizeValue(newSize);
    setTileSize({ width: newSize, height: newSize });
  };

  const bounds = getMapBounds();
  const activeLayer = tileMap.layers.find(layer => layer.id === activeLayerId);

  return (
    <header className="bg-white border-b px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Undo
        </button>
        <button
          onClick={redo}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Redo
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm">
          <span>Tamanho dos Tiles:</span>
          <input
            type="number"
            value={tileSizeValue}
            onChange={(e) => handleTileSizeChange(Math.max(1, Number(e.target.value)))}
            className="w-16 px-2 py-1 border rounded text-sm"
            min="1"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600">
          Mapa: {bounds.width}×{bounds.height}
        </span>
        <span className="text-sm text-gray-600">
          Layer Ativa: {activeLayer?.name || 'Nenhuma'}
        </span>
        <span className="text-sm text-gray-600">
          ({tileMap.layers.length} layers)
        </span>
        <button
          onClick={() => exportMap(tileSize.width)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1"
          title="Exportar Mapa (JSON)"
        >
          <Download size={14} />
          Exportar
        </button>
      </div>
    </header>
  );
}
