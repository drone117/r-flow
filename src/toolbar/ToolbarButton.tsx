import type { ReactNode } from 'react';

interface ToolbarButtonProps {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
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
