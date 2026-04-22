/**
 * Base node component — shared renderer for most node types.
 *
 * This is the workhorse of the node rendering system. Function, Event, Math,
 * Branch, Loop, and Pure nodes all delegate to BaseNode, which provides:
 *
 *   1. A colored header with a category icon and label
 *   2. A dynamic pin layout: input pins on the left, output pins on the right
 *   3. Inline value editors for unconnected data input pins
 *      - Text input for string/float/int
 *      - Dropdown (true/false) for bool
 *      - Hidden when the pin has a connected edge (value comes from upstream)
 *   4. Execution highlighting during graph execution
 *   5. Wildcard pin color resolution from connected edges
 *
 * How it works:
 *   - The node's `data` contains `inputs[]` and `outputs[]` pin definitions
 *   - Rows are created by pairing input[i] and output[i] side-by-side
 *   - `connectedInputIds` is computed from the current edge state — if an
 *     input pin has an incoming edge, the inline editor is hidden
 *   - `resolvedPinColors` maps wildcard pins to their resolved color based
 *     on what's connected to them (inherited from the connected pin's type)
 *
 * Important event handling:
 *   - `onClick` and `onMouseDown` use `e.stopPropagation()` on input fields
 *     to prevent React Flow from interpreting clicks/selections as node drags
 *   - The `nodrag` CSS class on inputs also prevents drag interference
 */
import { type NodeProps, Position, useReactFlow, useStore } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS, PIN_COLORS } from '../types';
import type { PinDataType } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { DataPin } from '../pins/DataPin';
import { PinLabel } from '../pins/PinLabel';
import { NodeIcon } from '../components/NodeIcon';
import { useExecutionStore } from '../store/executionStore';
import './BaseNode.css';

interface BaseNodeProps extends NodeProps {
  data: BlueprintNodeData;
}

export function BaseNode({ id, data }: BaseNodeProps) {
  const { setNodes } = useReactFlow();
  const { label, category, inputs = [], outputs = [], icon, values = {} } = data;
  const headerColor = CATEGORY_COLORS[category] ?? '#3a3a5c';

  // Check if this node is currently being executed (for glow animation)
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;

  /**
   * Set of input pin IDs that have an incoming edge connected.
   * Used to hide the inline value editor when a pin is wired.
   * Derived from the global edge state via useStore (re-renders on edge changes).
   */
  const connectedInputIds = useStore((s) => {
    const ids = new Set<string>();
    for (const e of s.edges) {
      if (e.target === id) {
        ids.add(e.targetHandle!);
      }
    }
    return ids;
  });

  /**
   * Resolve wildcard pin colors from connected edges.
   *
   * Wildcard pins don't have an inherent color — they adopt the color
   * of whatever is connected to them. This computed map stores the
   * resolved color for each wildcard pin handle ID.
   *
   * Resolution rules:
   *   - If a wildcard input pin has an incoming edge from a typed pin,
   *     it inherits that pin's color
   *   - If a wildcard output pin has an outgoing edge to a typed pin,
   *     it inherits that pin's color
   *   - Unconnected wildcard output pins inherit from any connected
   *     wildcard input pin on the same node (propagation)
   */
  const resolvedPinColors = useStore((s) => {
    const colors = new Map<string, string>();
    let inheritedColor: string | undefined;

    for (const e of s.edges) {
      // Look up the pin definitions on both ends of the edge
      const sourceNode = s.nodes.find((n) => n.id === e.source);
      const targetNode = s.nodes.find((n) => n.id === e.target);
      const sourcePin = sourceNode?.data?.outputs?.find((p: { id?: string }) => p.id === e.sourceHandle);
      const targetPin = targetNode?.data?.inputs?.find((p: { id?: string }) => p.id === e.targetHandle);
      const sourceType = (sourcePin?.dataType as PinDataType) ?? 'wildcard';
      const targetType = (targetPin?.dataType as PinDataType) ?? 'wildcard';

      // Determine the effective (non-wildcard) type of this connection
      const effectiveType = sourceType === 'wildcard' ? targetType : sourceType;
      if (effectiveType === 'wildcard') continue; // Both sides are wildcard — can't resolve
      const color = PIN_COLORS[effectiveType];
      if (!color) continue;

      // If this edge targets our node and our input pin is wildcard, inherit the color
      if (e.target === id) {
        const localTargetPin = inputs.find((p) => p.id === e.targetHandle);
        if (localTargetPin?.dataType === 'wildcard') {
          colors.set(e.targetHandle!, color);
          inheritedColor = color; // Remember for output propagation
        }
      }
      // If this edge originates from our node and our output pin is wildcard
      if (e.source === id) {
        const localSourcePin = outputs.find((p) => p.id === e.sourceHandle);
        if (localSourcePin?.dataType === 'wildcard') colors.set(e.sourceHandle!, color);
      }
    }

    // Propagate inherited color to unconnected wildcard output pins
    if (inheritedColor) {
      for (const out of outputs) {
        if (out.dataType === 'wildcard' && !colors.has(out.id)) {
          colors.set(out.id, inheritedColor);
        }
      }
    }
    return colors;
  });

  // Number of rows = max of inputs/outputs (pins are paired side by side)
  const maxRows = Math.max(inputs.length, outputs.length, 1);

  /** Update a value in this node's data.values map. Called by inline editors. */
  const onValueChange = (pinId: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            values: { ...(n.data as BlueprintNodeData).values, [pinId]: value },
          },
        };
      }),
    );
  };

  return (
    <div
      className={`blueprint-node ${category === 'comment' ? 'blueprint-node--comment' : ''} ${isActive ? 'blueprint-node--executing' : ''}`}
      style={{ '--header-color': headerColor } as React.CSSProperties}
    >
      {/* Node header: colored background with icon and label */}
      <div className="blueprint-node__header">
        <span className="blueprint-node__header-icon">
          <NodeIcon category={category} label={label} />
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>

      {/* Node body: pin rows with inline editors */}
      <div className="blueprint-node__body">
        {Array.from({ length: maxRows }).map((_, i) => {
          const input = inputs[i];
          const output = outputs[i];

          return (
            <div key={i} className="blueprint-node__row blueprint-node__row--both">
              {/* Left side: input pin + optional label + optional inline editor */}
              <div className="blueprint-node__pin-group">
                {input && input.dataType === 'execution' && (
                  <ExecutionPin id={input.id} type="target" position={Position.Left} />
                )}
                {input && input.dataType !== 'execution' && (
                  <DataPin id={input.id} type="target" dataType={input.dataType} position={Position.Left} color={resolvedPinColors.get(input.id)} />
                )}
                {/* Show inline editor only for data pins that aren't connected */}
                {input && input.dataType !== 'execution' && (
                  <>
                    <PinLabel label={input.label} side="left" />
                    {connectedInputIds.has(input.id) ? null : input.dataType === 'bool' ? (
                      // Boolean inputs use a dropdown instead of free text
                      <select
                        className="blueprint-node__pin-select nodrag"
                        value={values[input.id] ?? 'false'}
                        onChange={(e) => onValueChange(input.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      // String, float, int inputs use a text field
                      <input
                        className="blueprint-node__pin-input"
                        value={values[input.id] ?? ''}
                        onChange={(e) => onValueChange(input.id, e.target.value)}
                        placeholder={getPlaceholder(input.dataType)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Right side: output pin + optional label */}
              <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
                {output && output.label && (
                  <PinLabel label={output.label} side="right" />
                )}
                {output && output.dataType === 'execution' && (
                  <ExecutionPin id={output.id} type="source" position={Position.Right} />
                )}
                {output && output.dataType !== 'execution' && (
                  <DataPin id={output.id} type="source" dataType={output.dataType} position={Position.Right} color={resolvedPinColors.get(output.id)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Placeholder text shown in empty input fields, varies by data type. */
function getPlaceholder(dataType: string): string {
  switch (dataType) {
    case 'float': return '0.0';
    case 'int': return '0';
    case 'string': return '...';
    case 'bool': return 'false';
    default: return '...';
  }
}
