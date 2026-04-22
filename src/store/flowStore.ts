/**
 * Core graph state store.
 *
 * Manages the nodes and edges that make up the blueprint graph, plus
 * undo/redo history, snap-to-grid, minimap, and drag-and-drop node creation.
 *
 * This is the central store — almost every component reads from it.
 *
 * Key concepts:
 *   - Nodes are the boxes on the canvas (Print String, Branch, etc.)
 *   - Edges are the wires connecting node pins
 *   - The store uses Zustand, a lightweight state management library
 *   - React Flow calls onNodesChange/onEdgesChange when the user drags,
 *     deletes, or selects nodes/edges — we pass those through to Zustand
 *   - onConnect is called when the user draws a new wire between two pins
 */

import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { PIN_COLORS } from '../types';
import { isConvertible, getConversionLabel } from '../utils/conversionUtils';
import type { PinDataType } from '../types';

/** Maximum number of undo steps kept in history. */
const MAX_HISTORY = 50;

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  /** Previous states for undo (most recent last). */
  past: { nodes: Node[]; edges: Edge[] }[];
  /** Future states for redo (after an undo). */
  future: { nodes: Node[]; edges: Edge[] }[];
  snapEnabled: boolean;
  minimapEnabled: boolean;

  // --- React Flow callbacks (passed directly to <ReactFlow>) ---
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  // --- Actions ---
  addNode: (node: Node) => void;
  /** Add multiple nodes and edges at once (used by paste). Saves one undo snapshot. */
  pasteNodes: (newNodes: Node[], newEdges: Edge[]) => void;
  loadBlueprint: (nodes: Node[], edges: Edge[]) => void;
  toggleSnap: () => void;
  toggleMinimap: () => void;
  undo: () => void;
  redo: () => void;
}

/**
 * Save the current graph state into the undo history.
 * Called before any destructive change (drag complete, node delete, new connection).
 */
function saveSnapshot(
  state: FlowState,
): { past: FlowState['past']; future: FlowState['future'] } {
  const past = [
    ...state.past,
    { nodes: state.nodes, edges: state.edges },
  ].slice(-MAX_HISTORY);
  const future: FlowState['future'] = []; // Any redo history is invalidated
  return { past, future };
}

// --- Default graph shown when the app first loads ---
const initialNodes: Node[] = [
  {
    id: 'comment-1',
    type: 'commentNode',
    position: { x: 20, y: 40 },
    data: {
      label: 'Comment',
      category: 'comment',
      commentText: 'Press Run (▶) in the toolbar to execute the graph',
    },
  },
  {
    id: 'start-1',
    type: 'startNode',
    position: { x: 60, y: 200 },
    data: {
      label: 'Start',
      category: 'start',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  {
    id: 'func-1',
    type: 'functionNode',
    position: { x: 320, y: 180 },
    data: {
      label: 'Print String',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'string-in', label: 'In String', direction: 'target', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
      values: { 'string-in': 'Hello, Blueprint!' },
    },
  },
  {
    id: 'func-2',
    type: 'functionNode',
    position: { x: 320, y: 340 },
    data: {
      label: 'Print String',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'string-in', label: 'In String', direction: 'target', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
      values: { 'string-in': 'Second message' },
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-start-func1',
    source: 'start-1',
    sourceHandle: 'exec-out',
    target: 'func-1',
    targetHandle: 'exec-in',
    type: 'blueprint',
    data: { dataType: 'execution', pinColor: '#ffffff' },
  },
  {
    id: 'e-func1-func2',
    source: 'func-1',
    sourceHandle: 'exec-out',
    target: 'func-2',
    targetHandle: 'exec-in',
    type: 'blueprint',
    data: { dataType: 'execution', pinColor: '#ffffff' },
  },
];

/**
 * Build an Edge object with the blueprint type and data.
 * Called whenever a new connection is created (either direct or via conversion node).
 */
function buildEdge(conn: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }, dataType: PinDataType): Edge {
  return {
    ...conn,
    type: 'blueprint',
    data: {
      dataType,
      pinColor: PIN_COLORS[dataType] ?? '#aaaaaa',
    },
  };
}

/**
 * Track which nodes are currently being dragged. Used to save a snapshot
 * only once per drag (when dragging starts), rather than on every pixel movement.
 */
const draggingNodes = new Set<string>();

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  past: [],
  future: [],
  snapEnabled: true,
  minimapEnabled: true,

  /**
   * Called by React Flow when nodes change (drag, select, delete, etc.).
   * We save an undo snapshot when a drag starts or a node is deleted.
   */
  onNodesChange: (changes) => {
    const isDragStart = changes.some((c: NodeChange) =>
      c.type === 'position' && c.dragging === true && !draggingNodes.has(c.id),
    );
    const isRemove = changes.some((c: NodeChange) => c.type === 'remove');

    changes.forEach((c: NodeChange) => {
      if (c.type === 'position') {
        if (c.dragging === true) draggingNodes.add(c.id);
        if (c.dragging === false) draggingNodes.delete(c.id);
      }
    });

    if (isDragStart || isRemove) {
      set({ ...saveSnapshot(get()), nodes: applyNodeChanges(changes, get().nodes) });
      return;
    }
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  /**
   * Called by React Flow when edges change (delete, select, etc.).
   * We save an undo snapshot when an edge is deleted.
   */
  onEdgesChange: (changes) => {
    if (changes.some((c: EdgeChange) => c.type === 'remove')) {
      set({ ...saveSnapshot(get()), edges: applyEdgeChanges(changes, get().edges) });
      return;
    }
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  /**
   * Called when the user draws a wire between two pins.
   *
   * Connection logic:
   * 1. Look up the pin types on both sides.
   * 2. If types match, or either is wildcard → create a direct edge.
   * 3. If types differ but are convertible (e.g., float→string) →
   *    auto-insert a ConversionNode between them.
   * 4. Otherwise → reject (handled by isValidConnection in BlueprintCanvas).
   */
  onConnect: (connection) => {
    const { past, future } = saveSnapshot(get());
    const state = get();

    const sourceNode = state.nodes.find((n) => n.id === connection.source);
    const targetNode = state.nodes.find((n) => n.id === connection.target);
    const sourcePin = sourceNode?.data?.outputs?.find(
      (p: { id: string }) => p.id === connection.sourceHandle,
    );
    const targetPin = targetNode?.data?.inputs?.find(
      (p: { id: string }) => p.id === connection.targetHandle,
    );
    const sourceType = (sourcePin?.dataType ?? 'wildcard') as PinDataType;
    const targetType = (targetPin?.dataType ?? 'wildcard') as PinDataType;

    // Direct connection: types match, or one side is wildcard
    if (sourceType === targetType || sourceType === 'wildcard' || targetType === 'wildcard') {
      // When the source is wildcard, use the target's type as the resolved type
      const resolvedType = sourceType === 'wildcard' ? targetType : sourceType;
      const newEdge = buildEdge(connection, resolvedType);
      set({ edges: addEdge(newEdge, state.edges), past, future });
      return;
    }

    // Type mismatch but convertible → insert a ConversionNode between them
    if (isConvertible(sourceType, targetType)) {
      const convId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const midX = ((sourceNode?.position.x ?? 0) + (targetNode?.position.x ?? 0)) / 2;
      const midY = ((sourceNode?.position.y ?? 0) + (targetNode?.position.y ?? 0)) / 2;

      const convNode: Node = {
        id: convId,
        type: 'conversionNode',
        position: { x: midX, y: midY },
        data: {
          label: getConversionLabel(sourceType, targetType),
          category: 'conversion',
          sourceType,
          targetType,
          inputs: [
            { id: 'value-in', label: '', direction: 'target' as const, dataType: sourceType },
          ],
          outputs: [
            { id: 'value-out', label: '', direction: 'source' as const, dataType: targetType },
          ],
        },
      };

      // Edge from source → conversion node input
      const edge1 = buildEdge(
        { source: connection.source, sourceHandle: connection.sourceHandle, target: convId, targetHandle: 'value-in' },
        sourceType,
      );
      // Edge from conversion node output → target
      const edge2 = buildEdge(
        { source: convId, sourceHandle: 'value-out', target: connection.target, targetHandle: connection.targetHandle },
        targetType,
      );

      set({
        nodes: [...state.nodes, convNode],
        edges: addEdge(edge2, addEdge(edge1, state.edges)),
        past,
        future,
      });
      return;
    }

    // Non-convertible mismatch — shouldn't reach here due to isValidConnection guard
  },

  /** Add a new node to the canvas (used by drag-and-drop from the sidebar). */
  addNode: (node) => {
    const { past, future } = saveSnapshot(get());
    set({
      nodes: [...get().nodes, node],
      past,
      future,
    });
  },

  /**
   * Add multiple nodes and edges in a single operation.
   *
   * Used by the paste handler (Ctrl+V) to insert all copied nodes and their
   * internal edges at once. Saves a single undo snapshot for the entire
   * paste — undoing removes all pasted nodes/edges in one step.
   */
  pasteNodes: (newNodes, newEdges) => {
    const { past, future } = saveSnapshot(get());
    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
      past,
      future,
    });
  },

  /** Replace the entire graph (used by load/save blueprint). */
  loadBlueprint: (newNodes, newEdges) => {
    set({ nodes: newNodes, edges: newEdges, past: [], future: [] });
  },

  toggleSnap: () => set({ snapEnabled: !get().snapEnabled }),
  toggleMinimap: () => set({ minimapEnabled: !get().minimapEnabled }),

  /** Restore the previous graph state. */
  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, { nodes, edges }],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  /** Re-apply a state that was undone. */
  redo: () => {
    const { past, nodes, edges, future } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      past: [...past, { nodes, edges }],
      future: future.slice(0, -1),
      nodes: next.nodes,
      edges: next.edges,
    });
  },
}));
