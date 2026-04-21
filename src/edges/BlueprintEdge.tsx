import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

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

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: edgeColor,
        strokeWidth: isExecution ? 3 : 2,
        filter: `drop-shadow(0 0 3px ${edgeColor}40)`,
        ...style,
      }}
    />
  );
}
