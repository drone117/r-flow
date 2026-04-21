import { createContext, useContext, useState, type ReactNode } from 'react';

interface DnDContextType {
  draggedType: string | null;
  setDraggedType: (type: string | null) => void;
}

const DnDContext = createContext<DnDContextType>({
  draggedType: null,
  setDraggedType: () => {},
});

export function DnDProvider({ children }: { children: ReactNode }) {
  const [draggedType, setDraggedType] = useState<string | null>(null);

  return (
    <DnDContext.Provider value={{ draggedType, setDraggedType }}>
      {children}
    </DnDContext.Provider>
  );
}

export function useDnD() {
  return useContext(DnDContext);
}
