/**
 * Output console store.
 *
 * Manages the list of messages displayed in the OutputConsole component
 * at the bottom of the screen. Nodes like Print String and the executor
 * itself emit messages here during graph execution.
 */
import { create } from 'zustand';

interface OutputState {
  /** All messages in order (oldest first). */
  messages: string[];
  /** Append a message to the console. */
  addMessage: (msg: string) => void;
  /** Clear all messages (called before each execution run). */
  clearMessages: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}));
