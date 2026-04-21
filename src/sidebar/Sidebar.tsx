import { sidebarCategories } from '../components/nodeFactory';
import { SidebarCategory } from './SidebarCategory';
import './Sidebar.css';

export function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar__header">Node Palette</div>
      <div className="sidebar__content">
        {sidebarCategories.map((cat) => (
          <SidebarCategory key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
