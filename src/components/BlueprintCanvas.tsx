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
 *   - **Keyboard shortcuts**: Ctrl+Z = undo, Ctrl+Shift+Z or Ctrl+Y = redo,
 *     Ctrl+C = copy, Ctrl+V = paste at cursor position
 *   - **Copy/paste**: Copies selected nodes and their internal edges
 *     (edges where both endpoints are in the selection). Paste places
 *     the copied nodes centered on the current mouse cursor position.
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
  useOnSelectionChange,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { edgeTypes } from '../edges/edgeTypes';
import { useFlowStore } from '../store/flowStore';
import { generateId, generateEdgeId } from '../utils/idUtils';
import { createNodeFromType } from './nodeFactory';
import { isConvertible } from '../utils/conversionUtils';
import { CATEGORY_COLORS } from '../types';
import type { NodeCategory } from '../types';
import { Toolbar } from '../toolbar/Toolbar';
import { OutputConsole } from './OutputConsole';
import './BlueprintCanvas.css';

/**
 * Module-level clipboard for copy/paste.
 *
 * Kept outside the component so it persists across re-renders and doesn't
 * cause unnecessary state updates. This is the same pattern used by most
 * visual editors — the clipboard is a simple global variable.
 *
 * On copy (Ctrl+C):
 *   - Deep-clones all selected nodes via structuredClone
 *   - Collects "internal" edges — edges where BOTH source and target nodes
 *     are in the selection. Edges that connect to nodes outside the selection
 *     are intentionally dropped (they wouldn't make sense on the copy).
 *   - Records the top-left corner of the selection bounding box in `origin`.
 *     This is used to calculate relative positions when pasting.
 *
 * On paste (Ctrl+V):
 *   - Generates new unique IDs for every copied node and edge
 *   - Repositions nodes so that the selection's top-left corner aligns
 *     with the last known mouse cursor position (paste-at-cursor)
 *   - Remaps edge source/target IDs to point to the new node copies
 *   - Marks pasted nodes as selected, deselects everything else
 */
interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
  origin: { x: number; y: number }; // top-left corner of original selection
}
let clipboard: ClipboardData | null = null;

/**
 * Last known mouse position in flow (canvas) coordinates.
 *
 * Updated on every mousemove event via a window listener. Used as the
 * paste anchor — when the user presses Ctrl+V, the copied nodes are
 * placed so their bounding box origin aligns with this position.
 * Falls back to (0, 0) if the mouse hasn't moved yet.
 */
let lastMouseFlowPos: { x: number; y: number } | null = null;

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setNodes } = useReactFlow();
  // Read all state from the flow store
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const pasteNodes = useFlowStore((s) => s.pasteNodes);
  const snapEnabled = useFlowStore((s) => s.snapEnabled);
  const minimapEnabled = useFlowStore((s) => s.minimapEnabled);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);

  /**
   * Track which nodes are currently selected.
   *
   * Uses a ref (not state) to avoid re-renders on every selection change.
   * The ref is only read when Ctrl+C is pressed, so we don't need React
   * to re-render the canvas just because the selection changed.
   *
   * `useOnSelectionChange` from @xyflow/react fires whenever the user
   * selects or deselects nodes (click, Shift+click, drag-select, etc.).
   */
  const selectedIdsRef = useRef<Set<string>>(new Set());
  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      selectedIdsRef.current = new Set(selectedNodes.map((n) => n.id));
    },
  });

  /**
   * Track mouse position in flow (canvas) coordinates.
   *
   Converts screen pixel coordinates to canvas coordinates using
   * `screenToFlowPosition`, which accounts for pan and zoom.
   * This position is used as the paste anchor — when the user presses
   * Ctrl+V, nodes are placed at the cursor location.
   */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      lastMouseFlowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [screenToFlowPosition]);

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

  // Global keyboard shortcuts: undo, redo, copy, paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // --- Undo ---
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // --- Redo ---
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // --- Copy (Ctrl+C) ---
      // Deep-clones selected nodes and their internal edges into the module-level
      // clipboard. Only edges with both endpoints in the selection are copied;
      // edges connecting to external nodes are dropped.
      if (e.key === 'c') {
        e.preventDefault();
        const selectedIds = selectedIdsRef.current;
        if (selectedIds.size === 0) return;

        const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));
        if (selectedNodes.length === 0) return;

        // Deep-clone selected nodes
        const clonedNodes: Node[] = selectedNodes.map((n) => structuredClone(n));

        // Find the top-left corner of the selection for offset calculation
        const minX = Math.min(...clonedNodes.map((n) => n.position.x));
        const minY = Math.min(...clonedNodes.map((n) => n.position.y));

        // Collect internal edges (both endpoints in the selection)
        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
        const clonedEdges: Edge[] = edges
          .filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target))
          .map((e) => structuredClone(e));

        clipboard = { nodes: clonedNodes, edges: clonedEdges, origin: { x: minX, y: minY } };
        return;
      }

      // --- Paste (Ctrl+V) ---
      // Generates new IDs for all copied nodes and edges, repositions nodes
      // so the selection's top-left corner aligns with the cursor position,
      // remaps edge references, deselects existing nodes, and inserts
      // everything into the store in a single undo snapshot.
      if (e.key === 'v') {
        e.preventDefault();
        if (!clipboard) return;

        // Build old→new ID mapping
        const idMap = new Map<string, string>();
        for (const node of clipboard.nodes) {
          idMap.set(node.id, generateId());
        }

        // Use the last known mouse position as the paste anchor
        const anchor = lastMouseFlowPos ?? { x: 0, y: 0 };

        // Clone nodes with new IDs, reposition relative to cursor
        const newNodes: Node[] = clipboard.nodes.map((n) => ({
          ...structuredClone(n),
          id: idMap.get(n.id)!,
          position: {
            x: n.position.x - clipboard.origin.x + anchor.x,
            y: n.position.y - clipboard.origin.y + anchor.y,
          },
          selected: true,
        }));

        // Clone edges with remapped source/target IDs
        const newEdges: Edge[] = clipboard.edges.map((e) => ({
          ...structuredClone(e),
          id: generateEdgeId(),
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
        }));

        // Deselect all existing nodes, then paste
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));

        pasteNodes(newNodes, newEdges);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, nodes, edges, pasteNodes, setNodes]);

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
              const cat = (node.data as { category?: string })?.category as NodeCategory | undefined;
              return cat ? (CATEGORY_COLORS[cat] ?? '#252540') : '#252540';
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
