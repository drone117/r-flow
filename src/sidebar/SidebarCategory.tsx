import { useState } from 'react';
import type { SidebarCategory as SidebarCategoryType } from '../components/nodeFactory';
import { SidebarItem } from './SidebarItem';

interface SidebarCategoryProps {
  category: SidebarCategoryType;
}

export function SidebarCategory({ category }: SidebarCategoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="sidebar__category">
      <button
        className="sidebar__category-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{category.name}</span>
        <span className={`sidebar__category-arrow ${isOpen ? 'sidebar__category-arrow--open' : ''}`}>
          &#9654;
        </span>
      </button>
      <div className={`sidebar__category-items ${!isOpen ? 'sidebar__category-items--collapsed' : ''}`}>
        <div className="sidebar__category-items-inner">
          {category.items.map((item) => (
            <SidebarItem
              key={item.type}
              type={item.type}
              label={item.label}
              category={item.category}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
