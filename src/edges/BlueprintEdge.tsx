/**
 * Blueprint edge component — custom wire renderer.
 *
 * Renders the connections (wires) between node pins. Unlike React Flow's
 * default straight edges, BlueprintEdge draws:
 *
 *   - Bezier curves with a configurable curvature (0.4)
 *   - Color based on the pin's data type (stored in edge.data.pinColor)
 *   - Thicker lines for execution wires (3px vs 2px for data)
 *   - A glow effect (drop-shadow filter) matching the wire color
 *   - An animated dashed overlay when the edge is being traversed during execution
 *   - A diamond marker on edges connected to Array nodes
 *   - An invisible wide hit area (14px) for easy click-to-delete
 *
 * Alt+Click on an edge deletes it (alternative to selecting + Delete key).
 *
 * Color resolution:
 *   - If both pins have a fixed type → use the stored pinColor
 *   - If one pin is wildcard → resolve the color from the typed end
 *     (looks up the connected node's pin definition to get the actual type)
 */
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

  // Compute the bezier curve path between source and target pins
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  /**
   * Resolve the edge color.
   *
   * For edges with wildcard pins, looks up the actual connected type
   * and uses that type's color. Falls back to the stored pinColor.
   */
  const { resolvedColor, isArray } = useStore((s) => {
    const storedColor = (data as { pinColor?: string } | undefined)?.pinColor;
    if (!storedColor) return { resolvedColor: '#b1b1b7', isArray: false };

    const sourceNode = s.nodes.find((n) => n.id === source);
    const targetNode = s.nodes.find((n) => n.id === target);
    const sourcePin = sourceNode?.data?.outputs?.find((p: { id?: string }) => p.id === sourceHandle);
    const targetPin = targetNode?.data?.inputs?.find((p: { id?: string }) => p.id === targetHandle);
    const sourceType = (sourcePin?.dataType as PinDataType) ?? 'wildcard';
    const targetType = (targetPin?.dataType as PinDataType) ?? 'wildcard';

    // Check if this edge connects to/from an Array node (for diamond marker)
    const isArrayEdge = sourceNode?.type === 'arrayNode' || targetNode?.type === 'arrayNode';

    // Both pins have fixed types — use stored color as-is
    if (sourceType !== 'wildcard' && targetType !== 'wildcard') {
      return { resolvedColor: storedColor, isArray: isArrayEdge };
    }

    // One side is wildcard — resolve from the typed end
    const resolvedType = sourceType === 'wildcard' ? targetType : sourceType;
    const color = resolvedType !== 'wildcard' ? (PIN_COLORS[resolvedType] ?? storedColor) : storedColor;
    return { resolvedColor: color, isArray: isArrayEdge };
  });

  const edgeColor = resolvedColor;
  const isExecution = (data as { dataType?: string } | undefined)?.dataType === 'execution';
  const activeEdgeId = useExecutionStore((s) => s.activeEdgeId);
  const isActive = activeEdgeId === id;

  /** Alt+Click on an edge deletes it. */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) {
        e.stopPropagation();
        setEdges((eds) => eds.filter((edge) => edge.id !== id));
      }
    },
    [id, setEdges],
  );

  const s = 5; // Diamond marker half-size (for array edges)

  return (
    <>
      {/* Main edge path — colored bezier curve with glow */}
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
      {/* Animated overlay when the edge is being traversed during execution */}
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
      {/* Diamond marker for edges connected to Array nodes */}
      {isArray && (
        <polygon
          points={`${labelX},${labelY - s} ${labelX + s},${labelY} ${labelX},${labelY + s} ${labelX - s},${labelY}`}
          fill={edgeColor}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Invisible wide hit area for easy clicking (Alt+Click to delete) */}
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
