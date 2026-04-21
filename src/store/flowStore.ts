import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

const MAX_HISTORY = 50;

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  past: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];
  snapEnabled: boolean;
  minimapEnabled: boolean;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  toggleSnap: () => void;
  toggleMinimap: () => void;
  undo: () => void;
  redo: () => void;
}

function saveSnapshot(
  state: FlowState,
): { past: FlowState['past']; future: FlowState['future'] } {
  const past = [
    ...state.past,
    { nodes: state.nodes, edges: state.edges },
  ].slice(-MAX_HISTORY);
  const future: FlowState['future'] = [];
  return { past, future };
}

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

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  past: [],
  future: [],
  snapEnabled: true,
  minimapEnabled: true,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const { past, future } = saveSnapshot(get());
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const sourceHandle = sourceNode?.data?.outputs?.find(
      (p: { id: string }) => p.id === connection.sourceHandle,
    );
    const dataType = sourceHandle?.dataType ?? 'wildcard';

    const newEdge: Edge = {
      ...connection,
      type: 'blueprint',
      data: {
        dataType,
        pinColor:
          dataType === 'execution'
            ? '#ffffff'
            : dataType === 'float'
              ? '#e8d44d'
              : dataType === 'int'
                ? '#1bc6a0'
                : dataType === 'string'
                  ? '#f050a0'
                  : dataType === 'bool'
                    ? '#cc0000'
                    : dataType === 'object'
                      ? '#0066ff'
                      : '#aaaaaa',
      },
    };
    set({
      edges: addEdge(newEdge, get().edges),
      past,
      future,
    });
  },

  addNode: (node) => {
    const { past, future } = saveSnapshot(get());
    set({
      nodes: [...get().nodes, node],
      past,
      future,
    });
  },

  toggleSnap: () => set({ snapEnabled: !get().snapEnabled }),
  toggleMinimap: () => set({ minimapEnabled: !get().minimapEnabled }),

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
