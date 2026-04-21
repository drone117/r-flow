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
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;
  const connectedInputIds = useStore((s) => {
    const ids = new Set<string>();
    for (const e of s.edges) {
      if (e.target === id) {
        ids.add(e.targetHandle!);
      }
    }
    return ids;
  });

  const resolvedPinColors = useStore((s) => {
    const colors = new Map<string, string>();
    let inheritedColor: string | undefined;
    for (const e of s.edges) {
      const edgeType = (e.data as { dataType?: string } | undefined)?.dataType as PinDataType | undefined;
      if (!edgeType || edgeType === 'wildcard') continue;
      const color = PIN_COLORS[edgeType];
      if (!color) continue;
      // Target wildcard pin adopts source's type color
      if (e.target === id) {
        const targetPin = inputs.find((p) => p.id === e.targetHandle);
        if (targetPin?.dataType === 'wildcard') {
          colors.set(e.targetHandle!, color);
          inheritedColor = color;
        }
      }
      // Source wildcard pin adopts target's type color
      if (e.source === id) {
        const sourcePin = outputs.find((p) => p.id === e.sourceHandle);
        if (sourcePin?.dataType === 'wildcard') colors.set(e.sourceHandle!, color);
      }
    }
    // Propagate inherited type color to all unconnected wildcard outputs
    if (inheritedColor) {
      for (const out of outputs) {
        if (out.dataType === 'wildcard' && !colors.has(out.id)) {
          colors.set(out.id, inheritedColor);
        }
      }
    }
    return colors;
  });

  const maxRows = Math.max(inputs.length, outputs.length, 1);

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
      <div className="blueprint-node__header">
        <span className="blueprint-node__header-icon">
          <NodeIcon category={category} />
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {Array.from({ length: maxRows }).map((_, i) => {
          const input = inputs[i];
          const output = outputs[i];

          return (
            <div key={i} className="blueprint-node__row blueprint-node__row--both">
              <div className="blueprint-node__pin-group">
                {input && input.dataType === 'execution' && (
                  <ExecutionPin id={input.id} type="target" position={Position.Left} />
                )}
                {input && input.dataType !== 'execution' && (
                  <DataPin id={input.id} type="target" dataType={input.dataType} position={Position.Left} color={resolvedPinColors.get(input.id)} />
                )}
                {input && input.dataType !== 'execution' && (
                  <>
                    <PinLabel label={input.label} side="left" />
                    {connectedInputIds.has(input.id) ? null : input.dataType === 'bool' ? (
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

function getPlaceholder(dataType: string): string {
  switch (dataType) {
    case 'float': return '0.0';
    case 'int': return '0';
    case 'string': return '...';
    case 'bool': return 'false';
    default: return '...';
  }
}
