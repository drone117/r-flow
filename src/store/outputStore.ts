import { create } from 'zustand';

interface OutputState {
  messages: string[];
  addMessage: (msg: string) => void;
  clearMessages: () => void;
}

export const useOutputStore = create<OutputState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}));
