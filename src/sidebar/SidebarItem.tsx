import { type DragEvent } from 'react';
import { useDnD } from '../hooks/useDnD';

interface SidebarItemProps {
  type: string;
  label: string;
  category: string;
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
