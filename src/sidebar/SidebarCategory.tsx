/**
 * Sidebar category component.
 *
 * Renders a single collapsible section in the sidebar. Has two modes:
 *
 * 1. **Expanded mode**: Shows a header with the category name and a
 *    toggle arrow (▶/▼), plus a list of SidebarItem components that
 *    can be dragged onto the canvas.
 *
 * 2. **Collapsed mode** (when the entire sidebar is icon-only): Shows
 *    just a single icon button. Clicking it re-expands the sidebar
 *    with this category highlighted and opened.
 *
 * The `CATEGORY_ICONS` map maps category names to the icon key used
 * by the NodeIcon component.
 */
import type { SidebarCategory as SidebarCategoryType } from '../components/nodeFactory';
import { NodeIcon } from '../components/NodeIcon';
import { SidebarItem } from './SidebarItem';

/** Maps sidebar category names to NodeIcon category keys. */
const CATEGORY_ICONS: Record<string, string> = {
  Events: 'event',
  Functions: 'function',
  Constants: 'constant',
  Arrays: 'array',
  Math: 'math',
  'Flow Control': 'flowcontrol',
  Utilities: 'utilities',
};

interface SidebarCategoryProps {
  category: SidebarCategoryType;
  collapsed?: boolean;        // True when sidebar is in icon-only mode
  highlighted?: boolean;      // True when this category was just expanded from icon mode
  isOpen: boolean;            // Whether this category's items are visible
  onToggle?: (categoryName: string) => void;   // Toggle category open/closed
  onExpand?: (categoryName: string) => void;   // Re-expand sidebar from this category
}

export function SidebarCategory({ category, collapsed, highlighted, isOpen, onToggle, onExpand }: SidebarCategoryProps) {
  const iconKey = CATEGORY_ICONS[category.name] ?? '';

  // Icon-only mode: render a single button with the category icon
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

  // Full mode: header + collapsible item list
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
