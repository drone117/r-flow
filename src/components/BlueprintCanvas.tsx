import { useCallback, useEffect, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { edgeTypes } from '../edges/edgeTypes';
import { useFlowStore } from '../store/flowStore';
import { useDnD } from '../hooks/useDnD';
import { createNodeFromType } from './nodeFactory';
import { Toolbar } from '../toolbar/Toolbar';
import { OutputConsole } from './OutputConsole';
import './BlueprintCanvas.css';

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { draggedType, setDraggedType } = useDnD();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const snapEnabled = useFlowStore((s) => s.snapEnabled);
  const minimapEnabled = useFlowStore((s) => s.minimapEnabled);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = createNodeFromType(type, position);
      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div ref={reactFlowWrapper} className="blueprint-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        snapToGrid={snapEnabled}
        snapGrid={[20, 20]}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
        />
        {minimapEnabled && (
          <MiniMap
            nodeColor={(node) => {
              const cat = (node.data as { category?: string })?.category;
              switch (cat) {
                case 'function': return '#2d5baa';
                case 'event': return '#8b1a1a';
                case 'variable': return '#1a6b3c';
                case 'math': return '#1a6b6b';
                case 'branch':
                case 'loop': return '#555566';
                case 'comment': return '#c8a832';
                case 'pure': return '#3d3d5c';
                default: return '#252540';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            pannable
            zoomable
          />
        )}
        <Toolbar />
        <OutputConsole />
      </ReactFlow>
    </div>
  );
}

export function BlueprintCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
