import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { Close, Copy, Edit, Minus, Plus, Shield, Visible, ArrowUp, ArrowDown } from '@nsmr/pixelart-react';
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function LayerPanel() {
  const tileMap = useTileMapStore(s => s.tileMap);
  const activeLayerId = useTileMapStore(s => s.activeLayerId);
  const addLayer = useTileMapStore(s => s.addLayer);
  const deleteLayer = useTileMapStore(s => s.deleteLayer);
  const duplicateLayer = useTileMapStore(s => s.duplicateLayer);
  const setLayerVisible = useTileMapStore(s => s.setLayerVisible);
  const setLayerName = useTileMapStore(s => s.setLayerName);
  const setActiveLayer = useTileMapStore(s => s.setActiveLayer);
  const setLayerCollision = useTileMapStore(s => s.setLayerCollision);
  const reorderLayers = useTileMapStore(s => s.reorderLayers);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Funções simples para mover layers
  const moveLayerUp = (index: number) => {
    if (index > 0) {
      reorderLayers(index, index - 1);
    }
  };

  const moveLayerDown = (index: number) => {
    if (index < tileMap.layers.length - 1) {
      reorderLayers(index, index + 1);
    }
  };

  function handleEditName(layerId: string, currentName: string) {
    setEditingLayerId(layerId);
    setEditingName(currentName);
  }

  function handleSaveName() {
    if (editingLayerId) {
      setLayerName(editingLayerId, editingName);
      setEditingLayerId(null);
      setEditingName('');
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditingLayerId(null);
      setEditingName('');
    }
  }

  function countTilesInLayer(layer: any) {
    let count = 0;
    for (let y = 0; y < layer.data.length; y++) {
      for (let x = 0; x < layer.data[y].length; x++) {
        if (layer.data[y][x] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  return (
    <div className="h-full flex flex-col text-custom-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-custom-white">Layers</h3>
        <Button
          variant="secondary"
          onClick={addLayer}
          className="flex items-center gap-2"
          title="Add Layer"
        >
          <Plus size={14} />
          Add Layer
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {tileMap.layers.map((layer, index) => {
          const tileCount = countTilesInLayer(layer);
          
          return (
            <div
              key={layer.id}
              className={`mb-1 px-4 py-3 cursor-pointer transition-colors shadow-button h-10 ${
                activeLayerId === layer.id
                  ? 'bg-custom-light-gray border-custom-light-gray'
                  : 'bg-custom-medium-gray border-custom-light-gray hover:bg-custom-light-gray'
              }`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <div className="flex items-center gap-2">
                {/* Controles de movimento */}
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(index);
                    }}
                    disabled={index === 0}
                    className="w-4 h-4 flex items-center justify-center text-custom-light-gray hover:text-custom-color disabled:opacity-30 disabled:cursor-not-allowed bg-custom-black/50 hover:bg-custom-black/80 rounded border border-custom-light-gray/30 hover:border-custom-color/50 transition-all"
                    title="Move Layer Up"
                  >
                    <ArrowUp size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(index);
                    }}
                    disabled={index === tileMap.layers.length - 1}
                    className="w-4 h-4 flex items-center justify-center text-custom-light-gray hover:text-custom-color disabled:opacity-30 disabled:cursor-not-allowed bg-custom-black/50 hover:bg-custom-black/80 rounded border border-custom-light-gray/30 hover:border-custom-color/50 transition-all"
                    title="Move Layer Down"
                  >
                    <ArrowDown size={10} />
                  </button>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLayerVisible(layer.id, !layer.visible);
                  }}
                  className='w-4 h-4'
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Visible size={14}/> : <Minus size={14}/>}
                </button>

                {/* Layer name */}
                <div className="flex-1 min-w-0">
                  {editingLayerId === layer.id ? (
                    <Input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleSaveName}
                      size="sm"
                      className="text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="text-sm truncate"
                      title="Click edit button to rename"
                    >
                      {layer.name}
                    </div>
                  )}
                </div>

                {/* Tile count indicator */}
                <div className="text-xs text-custom-light-gray bg-custom-black px-1">
                  {tileCount}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {/* Collision Layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayerCollision(layer.id, !layer.isCollision);
                    }}
                    className={`w-4 h-4 ${
                      layer.isCollision 
                        ? 'text-custom-color' 
                        : 'text-custom-white hover:text-custom-color'
                    }`}
                    title={layer.isCollision ? 'Collision Layer (Active)' : 'Toggle Collision Layer'}
                  >
                    <Shield size={14} />
                  </button>

                  {/* Duplicate Layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    className="w-4 h-4 text-custom-white hover:text-custom-color"
                    title="Duplicate Layer"
                  >
                    <Copy size={14} />
                  </button>

                  {/* Rename Layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditName(layer.id, layer.name);
                    }}
                    className="w-4 h-4 text-custom-white hover:text-custom-color"
                    title="Rename Layer"
                  >
                    <Edit size={14} />
                  </button>

                  {/* Delete Layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tileMap.layers.length > 1) {
                        deleteLayer(layer.id);
                      }
                    }}
                    className="w-4 h-4 text-custom-white hover:text-red-500"
                    title="Delete Layer"
                    disabled={tileMap.layers.length <= 1}
                  >
                    <Close size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
