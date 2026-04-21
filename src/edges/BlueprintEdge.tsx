import { useCallback } from 'react';
import { BaseEdge, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import { useExecutionStore } from '../store/executionStore';

export function BlueprintEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  const edgeColor = (data as { pinColor?: string } | undefined)?.pinColor ?? '#b1b1b7';
  const isExecution = (data as { dataType?: string } | undefined)?.dataType === 'execution';
  const activeEdgeId = useExecutionStore((s) => s.activeEdgeId);
  const isActive = activeEdgeId === id;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) {
        e.stopPropagation();
        setEdges((eds) => eds.filter((edge) => edge.id !== id));
      }
    },
    [id, setEdges],
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: isExecution ? 3 : 2,
          filter: isActive
            ? `drop-shadow(0 0 6px ${edgeColor}) drop-shadow(0 0 12px ${edgeColor}80)`
            : `drop-shadow(0 0 3px ${edgeColor}40)`,
          ...style,
        }}
      />
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={isExecution ? 3 : 2}
          strokeDasharray="8 12"
          className="react-flow__edge-path"
          style={{
            filter: `drop-shadow(0 0 4px ${edgeColor})`,
            animation: 'edge-flow 0.4s linear infinite',
          }}
        />
      )}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="react-flow__edge-interaction"
        onClick={handleClick}
      />
    </>
  );
}
