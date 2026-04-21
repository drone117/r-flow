import { useState } from 'react';
import { sidebarCategories } from '../components/nodeFactory';
import { SidebarCategory } from './SidebarCategory';
import './Sidebar.css';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

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
          <SidebarCategory key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
