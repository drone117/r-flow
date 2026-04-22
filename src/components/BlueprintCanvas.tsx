/**
 * Blueprint canvas — the main workspace component.
 *
 * Renders the React Flow canvas where users build their node graphs.
 * This is the central UI component that ties together:
 *   - The node graph (nodes + edges from flowStore)
 *   - The sidebar (node palette for drag-and-drop)
 *   - The toolbar (Run, Undo/Redo, Save/Load, Zoom, etc.)
 *   - The output console (execution output log)
 *
 * Architecture:
 *   - `BlueprintCanvas` wraps everything in a `ReactFlowProvider` (required
 *     by React Flow for hooks like `useReactFlow` to work)
 *   - `CanvasInner` is the actual component inside the provider — it has
 *     access to React Flow hooks and store hooks
 *
 * Key behaviors:
 *   - **Drag and drop**: onDrop reads the node type from the drag data
 *     and calls `createNodeFromType()` to create a new node at the drop position
 *   - **Connection validation**: `isValidConnection` checks type compatibility
 *     before allowing a wire to be drawn. Special case: blocks string→Multiply
 *     connections (Multiply only works with numeric types)
 *   - **Keyboard shortcuts**: Ctrl+Z = undo, Ctrl+Shift+Z or Ctrl+Y = redo
 *   - **Snap to grid**: 20px grid, toggleable from the toolbar
 *   - **Minimap**: positioned bottom-left, color-coded by node category
 */
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
import { isConvertible } from '../utils/conversionUtils';
import { Toolbar } from '../toolbar/Toolbar';
import { OutputConsole } from './OutputConsole';
import './BlueprintCanvas.css';

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { draggedType, setDraggedType } = useDnD();

  // Read all state from the flow store
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

  // Allow dropping nodes from the sidebar onto the canvas
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop: read the node type from drag data, create a node at the drop position
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Convert screen coordinates to canvas coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = createNodeFromType(type, position);
      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  // Global keyboard shortcuts for undo/redo
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
        /**
         * Connection validation — called when the user drags a wire between
         * two pins. Returns false to reject the connection.
         *
         * Rules:
         *   1. Can't connect a node to itself
         *   2. Wildcard pins accept any type
         *   3. Same-type pins always connect
         *   4. Execution pins only connect to other execution pins
         *   5. Object pins don't convert to anything
         *   6. Otherwise, check isConvertible() — if true, a ConversionNode
         *      will be auto-inserted by flowStore.onConnect
         */
        isValidConnection={(connection) => {
          const { source, target, sourceHandle, targetHandle } = connection;

          // Self-connections are never allowed
          if (source === target) return false;

          const sourceNode = nodes.find((n) => n.id === source);
          const targetNode = nodes.find((n) => n.id === target);
          if (!sourceNode || !targetNode) return false;

          // Look up the pin definitions to get their data types
          const sourcePin = (sourceNode.data as { outputs?: { id: string; dataType: string }[] }).outputs?.find(
            (p) => p.id === sourceHandle,
          ) ?? (sourceNode.data as { inputs?: { id: string; dataType: string }[] }).inputs?.find(
            (p) => p.id === sourceHandle,
          );
          const targetPin = (targetNode.data as { inputs?: { id: string; dataType: string }[] }).inputs?.find(
            (p) => p.id === targetHandle,
          ) ?? (targetNode.data as { outputs?: { id: string; dataType: string }[] }).outputs?.find(
            (p) => p.id === targetHandle,
          );

          const sourceType = sourcePin?.dataType ?? 'wildcard';
          const targetType = targetPin?.dataType ?? 'wildcard';

          // Wildcard accepts anything
          if (sourceType === 'wildcard' || targetType === 'wildcard') {
            // Special case: block string connections to Multiply (numeric only)
            const targetLabel = (targetNode.data as { label?: string }).label;
            if (targetLabel === 'Multiply' && (sourceType === 'string' || targetType === 'string')) return false;
            return true;
          }
          // Same type → always valid
          if (sourceType === targetType) return true;
          // Execution pins only connect to execution
          if (sourceType === 'execution' || targetType === 'execution') return false;
          // Object type doesn't convert
          if (sourceType === 'object' || targetType === 'object') return false;
          // Check if conversion is possible (auto-inserts ConversionNode)
          return isConvertible(sourceType, targetType);
        }}
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
        {/* Dot grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
        />
        {/* Minimap with category-based node coloring */}
        {minimapEnabled && (
          <MiniMap
            position="bottom-left"
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
                case 'start': return '#1a8b3c';
                case 'conversion': return '#2a4a6b';
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

/**
 * Exported component — wraps CanvasInner in ReactFlowProvider.
 *
 * ReactFlowProvider is required for any component that uses React Flow hooks
 * (useReactFlow, useStore, etc.) to work. It must be an ancestor of the
 * <ReactFlow> component, not a sibling.
 */
export function BlueprintCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
