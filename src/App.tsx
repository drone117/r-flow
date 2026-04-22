/**
 * Root application component.
 *
 * Lays out the main UI structure:
 *   - DnDProvider: React context for drag-and-drop state (sidebar → canvas)
 *   - Sidebar: Left panel with the node palette (drag source)
 *   - BlueprintCanvas: Main canvas area with the node graph, toolbar, and output console
 *
 * The sidebar is a flexbox sibling of the canvas area — it takes a fixed
 * width and the canvas fills the remaining space.
 */
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
