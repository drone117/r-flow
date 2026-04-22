/**
 * Toolbar button component.
 *
 * A styled button used in the Toolbar. Features:
 *   - An SVG icon (passed as children via the `icon` prop)
 *   - A tooltip that appears on hover (via CSS :hover on `.toolbar__btn-tooltip`)
 *   - Disabled state (grayed out, no click)
 *   - Active state (highlighted background, for toggle buttons like Snap/Minimap)
 */
import type { ReactNode } from 'react';

interface ToolbarButtonProps {
  icon: ReactNode;    // SVG icon element
  tooltip: string;    // Tooltip text shown on hover
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;   // True for toggle buttons that are currently "on"
}

export function ToolbarButton({ icon, tooltip, onClick, disabled, active }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar__btn ${active ? 'toolbar__btn--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      {icon}
      <span className="toolbar__btn-tooltip">{tooltip}</span>
    </button>
  );
}
