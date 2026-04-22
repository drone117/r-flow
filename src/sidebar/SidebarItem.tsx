/**
 * Sidebar item component — a draggable node button.
 *
 * Each item represents a node type that can be dragged onto the canvas.
 * The drag-and-drop flow:
 *
 *   1. `onDragStart`: Sets the node type key in `event.dataTransfer`
 *      (using the 'application/reactflow' MIME type) and in the DnD context
 *   2. `onDragEnd`: Clears the DnD context (cleanup if drag was cancelled)
 *   3. BlueprintCanvas.onDrop reads the type and creates the node
 *
 * The item shows a colored dot indicator matching the node's category
 * (via CSS class `sidebar__item-dot--${category}`).
 */
import { type DragEvent } from 'react';
import { useDnD } from '../hooks/useDnD';

interface SidebarItemProps {
  type: string;     // Template key from nodeFactory.ts (e.g., 'printString')
  label: string;    // Display name (e.g., 'Print String')
  category: string; // Node category for color-coding (e.g., 'function')
}

export function SidebarItem({ type, label, category }: SidebarItemProps) {
  const { setDraggedType } = useDnD();

  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(type);
  };

  const onDragEnd = () => {
    setDraggedType(null);
  };

  return (
    <button
      className="sidebar__item"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      draggable
    >
      <span className={`sidebar__item-dot sidebar__item-dot--${category}`} />
      {label}
    </button>
  );
}
