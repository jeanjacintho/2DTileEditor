import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { useTilesetStore } from '../../hooks/useTileset';
import { useDrawModeStore } from '../../hooks/useDrawMode';
import { Download, Redo, Undo } from '@nsmr/pixelart-react';
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function Toolbar() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const undo = useTileMapStore(s => s.undo);
  const redo = useTileMapStore(s => s.redo);
  const exportMap = useTileMapStore(s => s.exportMap);
  const getMapBounds = useTileMapStore(s => s.getMapBounds);
  const activeLayerId = useTileMapStore(s => s.activeLayerId);
  const tileSize = useTilesetStore(s => s.tileSize);
  const setTileSize = useTilesetStore(s => s.setTileSize);
  const drawMode = useDrawModeStore(s => s.drawMode);
  const toggleDrawMode = useDrawModeStore(s => s.toggleDrawMode);
  const [tileSizeValue, setTileSizeValue] = useState(tileSize.width);

  const handleTileSizeChange = (newSize: number) => {
    setTileSizeValue(newSize);
    setTileSize({ width: newSize, height: newSize });
  };

  const bounds = getMapBounds();
  const activeLayer = tileMap.layers.find(layer => layer.id === activeLayerId);

  return (
    <header className="bg-custom-medium-gray border-b border-custom-light-gray px-4 flex items-center justify-between gap-4 h-16 text-custom-white">
      <div className="flex items-center gap-2">
        <Button variant='secondary'
          onClick={undo}
          className="flex items-center gap-2"
        >
          <Undo size={16} />
          Undo
        </Button>
        <Button variant='secondary'
          onClick={redo}
          className="flex items-center gap-2"
        >
          <Redo size={16} />
          Redo
        </Button>
      </div>

      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm text-custom-white">Tile size:</span>
        <Input
          type="number"
          value={tileSizeValue}
          onChange={(e) => handleTileSizeChange(Math.max(1, Number(e.target.value)))}
          min="1"
          size="md"
          className='w-14'
          placeholder="32"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant={drawMode === 'rectangular' ? 'primary' : 'secondary'}
          onClick={toggleDrawMode}
          className="flex items-center gap-2"
          title={`Modo de desenho: ${drawMode === 'normal' ? 'Normal' : 'Retangular'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          {drawMode === 'normal' ? 'Normal' : 'Retangular'}
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-custom-light-gray">
          Mapa: {bounds.width}×{bounds.height}
        </span>
        <span className="text-sm text-custom-light-gray">
          Layer Ativa: {activeLayer?.name || 'Nenhuma'}
        </span>
        <span className="text-sm text-custom-light-gray">
          ({tileMap.layers.length} layers)
        </span>
        <Button
          onClick={() => exportMap(tileSize.width)}
          title="Export Map (JSON)"
        >
          <Download size={14} />
          Export
        </Button>
      </div>
    </header>
  );
}
