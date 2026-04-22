/**
 * Drag-and-drop context hook.
 *
 * Provides a React context for tracking which node type is being dragged
 * from the sidebar. The flow:
 *
 *   1. User starts dragging a SidebarItem → sets `draggedType` via `setDraggedType`
 *   2. Canvas's `onDragOver` allows the drop (`dropEffect = 'move'`)
 *   3. Canvas's `onDrop` reads the type from `event.dataTransfer` and
 *      creates a new node via `createNodeFromType()`
 *   4. `onDragEnd` clears `draggedType` back to null
 *
 * The context is provided by `DnDProvider` in App.tsx and consumed
 * by both SidebarItem (to set the type) and BlueprintCanvas (to read it).
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

interface DnDContextType {
  draggedType: string | null;
  setDraggedType: (type: string | null) => void;
}

const DnDContext = createContext<DnDContextType>({
  draggedType: null,
  setDraggedType: () => {},
});

/** Context provider — wraps the entire app in App.tsx. */
export function DnDProvider({ children }: { children: ReactNode }) {
  const [draggedType, setDraggedType] = useState<string | null>(null);

  return (
    <DnDContext.Provider value={{ draggedType, setDraggedType }}>
      {children}
    </DnDContext.Provider>
  );
}

/** Hook to access the DnD context. */
export function useDnD() {
  return useContext(DnDContext);
}
