import { useState, useCallback } from 'react';
import { sidebarCategories } from '../components/nodeFactory';
import { SidebarCategory } from './SidebarCategory';
import './Sidebar.css';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const handleExpand = useCallback((categoryName: string) => {
    setCollapsed(false);
    setHighlighted(categoryName);
    setTimeout(() => setHighlighted(null), 3000);
  }, []);

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        {!collapsed && <span>Node Palette</span>}
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
            onExpand={handleExpand}
          />
        ))}
      </div>
    </div>
  );
}
