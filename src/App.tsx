import { DnDProvider } from './hooks/useDnD';
import { Sidebar } from './sidebar/Sidebar';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import './App.css';

function App() {
  return (
    <DnDProvider>
      <div className="app">
        <Sidebar />
        <div className="app__canvas-area">
          <BlueprintCanvas />
        </div>
      </div>
    </DnDProvider>
  );
}

export default App;
