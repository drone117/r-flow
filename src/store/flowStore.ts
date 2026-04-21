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
      commentText: 'Startup logic — prints welcome message on BeginPlay',
    },
  },
  {
    id: 'event-1',
    type: 'eventNode',
    position: { x: 60, y: 160 },
    data: {
      label: 'Event BeginPlay',
      category: 'event',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  {
    id: 'var-1',
    type: 'variableNode',
    position: { x: 60, y: 320 },
    data: {
      label: 'Get "Welcome"',
      category: 'variable',
      outputs: [
        { id: 'value-out', label: 'Value', direction: 'source', dataType: 'string' },
      ],
    },
  },
  {
    id: 'func-1',
    type: 'functionNode',
    position: { x: 340, y: 140 },
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
    },
  },
  {
    id: 'math-1',
    type: 'mathNode',
    position: { x: 340, y: 310 },
    data: {
      label: 'Float + Float',
      category: 'math',
      inputs: [
        { id: 'a', label: 'A', direction: 'target', dataType: 'float' },
        { id: 'b', label: 'B', direction: 'target', dataType: 'float' },
      ],
      outputs: [
        { id: 'result', label: 'Result', direction: 'source', dataType: 'float' },
      ],
    },
  },
  {
    id: 'branch-1',
    type: 'branchNode',
    position: { x: 640, y: 140 },
    data: {
      label: 'Branch',
      category: 'branch',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'condition', label: 'Condition', direction: 'target', dataType: 'bool' },
      ],
      outputs: [
        { id: 'true', label: 'True', direction: 'source', dataType: 'execution' },
        { id: 'false', label: 'False', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  {
    id: 'loop-1',
    type: 'loopNode',
    position: { x: 960, y: 100 },
    data: {
      label: 'For Loop',
      category: 'loop',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'first-index', label: 'First Index', direction: 'target', dataType: 'int' },
        { id: 'last-index', label: 'Last Index', direction: 'target', dataType: 'int' },
      ],
      outputs: [
        { id: 'body', label: 'Loop Body', direction: 'source', dataType: 'execution' },
        { id: 'completed', label: 'Completed', direction: 'source', dataType: 'execution' },
        { id: 'index', label: 'Index', direction: 'source', dataType: 'int' },
      ],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-event-func',
    source: 'event-1',
    sourceHandle: 'exec-out',
    target: 'func-1',
    targetHandle: 'exec-in',
    type: 'blueprint',
    data: { dataType: 'execution', pinColor: '#ffffff' },
  },
  {
    id: 'e-var-func',
    source: 'var-1',
    sourceHandle: 'value-out',
    target: 'func-1',
    targetHandle: 'string-in',
    type: 'blueprint',
    data: { dataType: 'string', pinColor: '#f050a0' },
  },
  {
    id: 'e-func-branch',
    source: 'func-1',
    sourceHandle: 'exec-out',
    target: 'branch-1',
    targetHandle: 'exec-in',
    type: 'blueprint',
    data: { dataType: 'execution', pinColor: '#ffffff' },
  },
  {
    id: 'e-branch-loop',
    source: 'branch-1',
    sourceHandle: 'true',
    target: 'loop-1',
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
