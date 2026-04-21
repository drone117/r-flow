import { useState, useCallback } from 'react';
import { sidebarCategories } from '../components/nodeFactory';
import { SidebarCategory } from './SidebarCategory';
import './Sidebar.css';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(sidebarCategories.map((c) => c.name)));
  const allOpen = openCategories.size === sidebarCategories.length;

  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setOpenCategories(new Set());
  }, []);

  const expandAll = useCallback(() => {
    setOpenCategories(new Set(sidebarCategories.map((c) => c.name)));
  }, []);

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
