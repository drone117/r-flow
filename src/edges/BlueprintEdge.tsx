import { useCallback } from 'react';
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  const { resolvedColor, isArray } = useStore((s) => {
    const storedColor = (data as { pinColor?: string } | undefined)?.pinColor;
    if (!storedColor) return { resolvedColor: '#b1b1b7', isArray: false };

    const sourceNode = s.nodes.find((n) => n.id === source);
    const targetNode = s.nodes.find((n) => n.id === target);
    const sourcePin = sourceNode?.data?.outputs?.find((p: { id?: string }) => p.id === sourceHandle);
    const targetPin = targetNode?.data?.inputs?.find((p: { id?: string }) => p.id === targetHandle);
    const sourceType = (sourcePin?.dataType as PinDataType) ?? 'wildcard';
    const targetType = (targetPin?.dataType as PinDataType) ?? 'wildcard';

    const isArrayEdge = sourceNode?.type === 'arrayNode' || targetNode?.type === 'arrayNode';

    // If neither pin is wildcard, use stored color as-is
    if (sourceType !== 'wildcard' && targetType !== 'wildcard') {
      return { resolvedColor: storedColor, isArray: isArrayEdge };
    }

    // Otherwise resolve from the typed end
    const resolvedType = sourceType === 'wildcard' ? targetType : sourceType;
    const color = resolvedType !== 'wildcard' ? (PIN_COLORS[resolvedType] ?? storedColor) : storedColor;
    return { resolvedColor: color, isArray: isArrayEdge };
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

  const s = 5; // diamond half-size

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
      {isArray && (
        <polygon
          points={`${labelX},${labelY - s} ${labelX + s},${labelY} ${labelX},${labelY + s} ${labelX - s},${labelY}`}
          fill={edgeColor}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
          style={{ pointerEvents: 'none' }}
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
