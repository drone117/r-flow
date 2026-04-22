/**
 * Execution state store.
 *
 * Tracks which node and edge are currently "active" (highlighted) during
 * graph execution, and whether an execution is currently running.
 *
 * The executor calls setActiveNode/setActiveEdge as it walks the graph,
 * and the canvas uses these values to apply a glowing CSS animation.
 */
import { create } from 'zustand';

interface ExecutionState {
  /** ID of the node currently being processed, or null when idle. */
  activeNodeId: string | null;
  /** ID of the edge currently being traversed, or null when idle. */
  activeEdgeId: string | null;
  /** True while the graph is being executed. */
  isExecuting: boolean;
  setActiveNode: (id: string | null) => void;
  setActiveEdge: (id: string | null) => void;
  /** Called before execution starts. Clears previous highlights. */
  startExecution: () => void;
  /** Called after execution finishes. Clears highlights. */
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
