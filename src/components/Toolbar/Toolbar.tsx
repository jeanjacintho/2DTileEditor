import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';

export default function Toolbar() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const setMapSize = useTileMapStore(s => s.setMapSize);
  const undo = useTileMapStore(s => s.undo);
  const redo = useTileMapStore(s => s.redo);
  const activeLayerId = useTileMapStore(s => s.activeLayerId);
  const tileSize = useTilesetStore(s => s.tileSize);
  const setTileSize = useTilesetStore(s => s.setTileSize);
  const [width, setWidth] = useState(tileMap.width);
  const [height, setHeight] = useState(tileMap.height);
  const [tileSizeValue, setTileSizeValue] = useState(tileSize.width);

  function handleApplySize() {
    setMapSize(width, height);
  }

  function handleTileSizeChange(value: number) {
    setTileSizeValue(value);
    setTileSize({ width: value, height: value });
  }

  const activeLayer = tileMap.layers.find(layer => layer.id === activeLayerId);

  return (
    <header className="w-full h-12 bg-gray-100 border-b flex items-center px-4 gap-4">
      <span className="font-bold">Toolbar</span>
      <button className="px-2 py-1 bg-gray-200 rounded" onClick={undo} title="Desfazer (Ctrl+Z)">
        ⎌ Undo
      </button>
      <button className="px-2 py-1 bg-gray-200 rounded" onClick={redo} title="Refazer (Ctrl+Y)">
        ↻ Redo
      </button>
      
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm">
          <span className="text-gray-600">Tamanho dos Tiles:</span>
          <input
            type="number"
            min={1}
            value={tileSizeValue}
            onChange={e => handleTileSizeChange(Math.max(1, Number(e.target.value)))}
            className="w-16 border rounded px-2 py-1 bg-white text-sm"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm">
          <span className="text-gray-600">Largura do Mapa:</span>
          <input
            type="number"
            min={1}
            value={width}
            onChange={e => setWidth(Math.max(1, Number(e.target.value)))}
            className="w-16 border rounded px-2 py-1 bg-white text-sm"
          />
        </label>
        <label className="flex items-center gap-1 text-sm">
          <span className="text-gray-600">Altura do Mapa:</span>
          <input
            type="number"
            min={1}
            value={height}
            onChange={e => setHeight(Math.max(1, Number(e.target.value)))}
            className="w-16 border rounded px-2 py-1 bg-white text-sm"
          />
        </label>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={handleApplySize}
        >
          Aplicar
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600">Layer Ativa:</span>
        <span className="text-sm font-medium bg-blue-100 px-2 py-1 rounded">
          {activeLayer?.name || 'Nenhuma'}
        </span>
        <span className="text-sm text-gray-500">
          ({tileMap.layers.length} layers)
        </span>
      </div>
    </header>
  );
}
