import Toolbar from './components/Toolbar/Toolbar';
import TilePalette from './components/TilePalette/TilePalette';
import CanvasEditor from './components/Canvas/CanvasEditor';
import { Heart } from '@nsmr/pixelart-react';

function App() {
  return (
    <div className="w-screen h-screen min-h-0 min-w-0 flex-col flex overflow-hidden bg-custom-black text-custom-white">
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        <TilePalette />
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Toolbar />
          <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
            <CanvasEditor />
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center text-sm text-custom-light-gray border-t border-custom-medium-gray pt-2 pb-2">
        <a href="https://github.com/jeanjacintho" target="_blank" rel="noopener noreferrer" className='flex items-center gap-2'>Make with <Heart /> by Jean Jacintho</a>
      </div>
    </div>
  );
}

export default App;
