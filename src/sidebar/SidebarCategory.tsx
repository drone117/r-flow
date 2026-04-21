import type { SidebarCategory as SidebarCategoryType } from '../components/nodeFactory';
import { NodeIcon } from '../components/NodeIcon';
import { SidebarItem } from './SidebarItem';

const CATEGORY_ICONS: Record<string, string> = {
  Events: 'event',
  Functions: 'function',
  Variables: 'variable',
  Constants: 'constant',
  Arrays: 'array',
  Maps: 'map',
  Math: 'math',
  'Flow Control': 'flowcontrol',
  Utilities: 'utilities',
};

interface SidebarCategoryProps {
  category: SidebarCategoryType;
  collapsed?: boolean;
  highlighted?: boolean;
  isOpen: boolean;
  onToggle?: (categoryName: string) => void;
  onExpand?: (categoryName: string) => void;
}

export function SidebarCategory({ category, collapsed, highlighted, isOpen, onToggle, onExpand }: SidebarCategoryProps) {
  const iconKey = CATEGORY_ICONS[category.name] ?? '';

  if (collapsed) {
    return (
      <button
        className="sidebar__category-icon-btn"
        title={category.name}
        onClick={() => onExpand?.(category.name)}
      >
        <NodeIcon category={iconKey} />
      </button>
    );
  }

  return (
    <div className="sidebar__category">
      <button
        className={`sidebar__category-header ${highlighted ? 'sidebar__category-header--highlighted' : ''}`}
        onClick={() => onToggle?.(category.name)}
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
