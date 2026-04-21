import { Panel } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../store/flowStore';
import { ToolbarButton } from './ToolbarButton';
import './Toolbar.css';

export function Toolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const past = useFlowStore((s) => s.past);
  const future = useFlowStore((s) => s.future);
  const snapEnabled = useFlowStore((s) => s.snapEnabled);
  const minimapEnabled = useFlowStore((s) => s.minimapEnabled);
  const toggleSnap = useFlowStore((s) => s.toggleSnap);
  const toggleMinimap = useFlowStore((s) => s.toggleMinimap);

  return (
    <Panel position="top-center">
      <div className="toolbar">
        {/* Undo */}
        <ToolbarButton
          tooltip="Undo (Ctrl+Z)"
          disabled={past.length === 0}
          onClick={undo}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10h13a4 4 0 0 1 0 8H7" />
              <path d="M7 6L3 10l4 4" />
            </svg>
          }
        />

        {/* Redo */}
        <ToolbarButton
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={future.length === 0}
          onClick={redo}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10H8a4 4 0 0 0 0 8h9" />
              <path d="M17 6l4 4-4 4" />
            </svg>
          }
        />

        <div className="toolbar__separator" />

        {/* Zoom In */}
        <ToolbarButton
          tooltip="Zoom In"
          onClick={() => zoomIn({ duration: 200 })}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          }
        />

        {/* Zoom Out */}
        <ToolbarButton
          tooltip="Zoom Out"
          onClick={() => zoomOut({ duration: 200 })}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          }
        />

        {/* Fit View */}
        <ToolbarButton
          tooltip="Fit View"
          onClick={() => fitView({ duration: 300 })}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          }
        />

        <div className="toolbar__separator" />

        {/* Snap to Grid */}
        <ToolbarButton
          tooltip="Snap to Grid"
          active={snapEnabled}
          onClick={toggleSnap}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3v18h18" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          }
        />

        {/* Minimap */}
        <ToolbarButton
          tooltip="Toggle Minimap"
          active={minimapEnabled}
          onClick={toggleMinimap}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" opacity="0.3" />
              <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
            </svg>
          }
        />
      </div>
    </Panel>
  );
}
