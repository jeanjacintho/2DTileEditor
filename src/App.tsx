import Toolbar from './components/Toolbar/Toolbar';
import TilePalette from './components/TilePalette/TilePalette';
import CanvasEditor from './components/Canvas/CanvasEditor';
import LayerPanel from './components/LayerPanel/LayerPanel';

function App() {
  return (
    <div className="w-screen h-screen min-h-0 min-w-0 flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        <TilePalette />
        <CanvasEditor />
        <LayerPanel />
      </div>
    </div>
  );
}

export default App;
