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
 *
 * The context is provided by `DnDProvider` in App.tsx and consumed
 * by SidebarItem (to set the dragged type).
 */

import { useContext } from 'react';
import type { DnDContextType } from './useDnDContext';
import { DnDContext } from './useDnDContext';

/** Hook to access the DnD context. */
export function useDnD(): DnDContextType {
  return useContext(DnDContext);
}
