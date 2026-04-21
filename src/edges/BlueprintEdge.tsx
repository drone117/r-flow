import { useCallback, useMemo } from 'react';
import { BaseEdge, getBezierPath, useReactFlow, useStore, type EdgeProps } from '@xyflow/react';
import { useExecutionStore } from '../store/executionStore';
import { PIN_COLORS } from '../types';
import type { PinDataType } from '../types';

export function BlueprintEdge({
  id,
  source,
  sourceHandle,
  target,
  targetHandle,
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

  const resolvedColor = useStore((s) => {
    const storedColor = (data as { pinColor?: string } | undefined)?.pinColor;
    if (!storedColor) return '#b1b1b7';

    const sourceNode = s.nodes.find((n) => n.id === source);
    const targetNode = s.nodes.find((n) => n.id === target);
    const sourcePin = sourceNode?.data?.outputs?.find((p: { id?: string }) => p.id === sourceHandle);
    const targetPin = targetNode?.data?.inputs?.find((p: { id?: string }) => p.id === targetHandle);
    const sourceType = (sourcePin?.dataType as PinDataType) ?? 'wildcard';
    const targetType = (targetPin?.dataType as PinDataType) ?? 'wildcard';

    // If neither pin is wildcard, use stored color as-is
    if (sourceType !== 'wildcard' && targetType !== 'wildcard') return storedColor;

    // Otherwise resolve from the typed end
    const resolvedType = sourceType === 'wildcard' ? targetType : sourceType;
    if (resolvedType !== 'wildcard') return PIN_COLORS[resolvedType] ?? storedColor;
    return storedColor;
  });

  const edgeColor = resolvedColor;
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
