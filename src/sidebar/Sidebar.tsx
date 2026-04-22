/**
 * Sidebar component — the node palette.
 *
 * A collapsible panel on the left side of the screen that lists all
 * available node types, organized into categories. Users drag nodes
 * from here onto the canvas.
 *
 * Features:
 *   - **Collapse/expand**: The entire sidebar can be collapsed to just
 *     icons, or expanded to show full category headers and item lists
 *   - **Category toggle**: Each category can be independently opened/closed
 *   - **Collapse all / Expand all**: A single button toggles all categories
 *   - **Category icons**: When the sidebar is collapsed, each category
 *     shows only its icon as a button. Clicking it re-expands the sidebar
 *     with that category highlighted for 3 seconds
 *
 * State:
 *   - `collapsed`: whether the sidebar is fully collapsed (icon-only mode)
 *   - `openCategories`: set of currently expanded category names
 *   - `highlighted`: which category name is temporarily highlighted
 *     (set when expanding from icon-only mode, auto-clears after 3s)
 */
import { useState, useCallback } from 'react';
import { sidebarCategories } from '../components/nodeFactory';
import { SidebarCategory } from './SidebarCategory';
import './Sidebar.css';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(sidebarCategories.map((c) => c.name)));
  const allOpen = openCategories.size === sidebarCategories.length;

  /** Toggle a single category open/closed. */
  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  /** Collapse all categories. */
  const collapseAll = useCallback(() => {
    setOpenCategories(new Set());
  }, []);

  /** Expand all categories. */
  const expandAll = useCallback(() => {
    setOpenCategories(new Set(sidebarCategories.map((c) => c.name)));
  }, []);

  /** Re-expand the sidebar from icon-only mode, highlighting the selected category. */
  const handleExpand = useCallback((categoryName: string) => {
    setCollapsed(false);
    setHighlighted(categoryName);
    setOpenCategories(new Set([categoryName]));
    setTimeout(() => setHighlighted(null), 3000);
  }, []);

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        {!collapsed && <span>Node Palette</span>}
        {!collapsed && (
          <button
            className="sidebar__collapse-all"
            onClick={allOpen ? collapseAll : expandAll}
            title={allOpen ? 'Collapse all' : 'Expand all'}
          >
            {allOpen ? '«' : '»'}
          </button>
        )}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand palette' : 'Collapse palette'}
        >
          {collapsed ? '▸' : '◂'}
        </button>
      </div>
      <div className="sidebar__content">
        {sidebarCategories.map((cat) => (
          <SidebarCategory
            key={cat.name}
            category={cat}
            collapsed={collapsed}
            highlighted={highlighted === cat.name}
            isOpen={openCategories.has(cat.name)}
            onToggle={toggleCategory}
            onExpand={handleExpand}
          />
        ))}
      </div>
    </div>
  );
}
