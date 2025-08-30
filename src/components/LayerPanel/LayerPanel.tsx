import { useState } from 'react';
import { useTileMapStore } from '../../hooks/useTileMap';
import { Shield, Copy, Edit3, Trash2 } from 'lucide-react';

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

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
    <aside className="w-64 bg-gray-50 border-l h-full flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-700">Layers</h3>
        <button
          onClick={addLayer}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          title="Add Layer"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tileMap.layers.map((layer) => {
          const tileCount = countTilesInLayer(layer);
          return (
            <div
              key={layer.id}
              className={`mb-1 p-2 rounded border cursor-pointer transition-colors ${
                activeLayerId === layer.id
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <div className="flex items-center gap-2">
                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLayerVisible(layer.id, !layer.visible);
                  }}
                  className={`w-4 h-4 rounded ${
                    layer.visible ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible && (
                    <div className="w-2 h-2 bg-white rounded m-0.5"></div>
                  )}
                </button>

                {/* Layer name */}
                <div className="flex-1 min-w-0">
                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleSaveName}
                      className="w-full text-sm border rounded px-1"
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
                <div className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
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
                        ? 'text-orange-600' 
                        : 'text-gray-500 hover:text-orange-600'
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
                    className="w-4 h-4 text-gray-500 hover:text-blue-600"
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
                    className="w-4 h-4 text-gray-500 hover:text-green-600"
                    title="Rename Layer"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Delete Layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tileMap.layers.length > 1) {
                        deleteLayer(layer.id);
                      }
                    }}
                    className="w-4 h-4 text-gray-500 hover:text-red-600"
                    title="Delete Layer"
                    disabled={tileMap.layers.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <div>• Click to place tiles in active layer</div>
        <div>• Active layer: {tileMap.layers.find(l => l.id === activeLayerId)?.name || 'None'}</div>
      </div>
    </aside>
  );
}
