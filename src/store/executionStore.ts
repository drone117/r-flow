import { create } from 'zustand';

interface ExecutionState {
  activeNodeId: string | null;
  activeEdgeId: string | null;
  isExecuting: boolean;
  setActiveNode: (id: string | null) => void;
  setActiveEdge: (id: string | null) => void;
  startExecution: () => void;
  stopExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  activeNodeId: null,
  activeEdgeId: null,
  isExecuting: false,
  setActiveNode: (id) => set({ activeNodeId: id }),
  setActiveEdge: (id) => set({ activeEdgeId: id }),
  startExecution: () => set({ isExecuting: true, activeNodeId: null, activeEdgeId: null }),
  stopExecution: () => set({ isExecuting: false, activeNodeId: null, activeEdgeId: null }),
}));
