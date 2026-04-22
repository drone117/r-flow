/**
 * DnD context — shared state for the DnDProvider component and useDnD hook.
 */

import { createContext } from 'react';

export interface DnDContextType {
  draggedType: string | null;
  setDraggedType: (type: string | null) => void;
}

export const DnDContext = createContext<DnDContextType>({
  draggedType: null,
  setDraggedType: () => {},
});
