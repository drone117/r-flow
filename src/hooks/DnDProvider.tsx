/**
 * Drag-and-drop context provider.
 *
 * Wraps the entire app to provide DnD context for drag-and-drop state
 * between the sidebar (drag source) and canvas (drop target).
 */

import { useState, type ReactNode } from 'react';
import { DnDContext } from './useDnDContext';

/** Context provider — wraps the entire app in App.tsx. */
export function DnDProvider({ children }: { children: ReactNode }) {
  const [draggedType, setDraggedType] = useState<string | null>(null);

  return (
    <DnDContext.Provider value={{ draggedType, setDraggedType }}>
      {children}
    </DnDContext.Provider>
  );
}
