import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';

export default function Toolbar() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const setMapSize = useTileMapStore(s => s.setMapSize);
  const undo = useTileMapStore(s => s.undo);
  const redo = useTileMapStore(s => s.redo);
  const [width, setWidth] = useState(tileMap.width);
  const [height, setHeight] = useState(tileMap.height);

  function handleApplySize() {
    setMapSize(width, height);
  }

  return (
    <header className="w-full h-12 bg-gray-100 border-b flex items-center px-4 gap-4">
      <span className="font-bold">Toolbar</span>
      <button className="px-2 py-1 bg-gray-200 rounded" onClick={undo} title="Desfazer (Ctrl+Z)">
        ⎌ Undo
      </button>
      <button className="px-2 py-1 bg-gray-200 rounded" onClick={redo} title="Refazer (Ctrl+Y)">
        ↻ Redo
      </button>
      <label className="flex items-center gap-1">
        Largura
        <input
          type="number"
          min={1}
          value={width}
          onChange={e => setWidth(Math.max(1, Number(e.target.value)))}
          className="w-16 border rounded px-1 bg-transparent"
        />
      </label>
      <label className="flex items-center gap-1">
        Altura
        <input
          type="number"
          min={1}
          value={height}
          onChange={e => setHeight(Math.max(1, Number(e.target.value)))}
          className="w-16 border rounded px-1 bg-transparent"
        />
      </label>
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded"
        onClick={handleApplySize}
      >
        Definir tamanho do mapa
      </button>
    </header>
  );
}
