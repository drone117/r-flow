import { type NodeProps, Position } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { NodeIcon } from '../components/NodeIcon';
import './BaseNode.css';

export function StartNode({ data }: NodeProps) {
  const { label, category, outputs = [] } = data as BlueprintNodeData;
  const headerColor = CATEGORY_COLORS['start'];

  return (
    <div
      className="blueprint-node"
      style={{ '--header-color': headerColor } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        <span className="blueprint-node__header-icon">
          <NodeIcon category="start" />
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {outputs.map((output) => (
          <div key={output.id} className="blueprint-node__row">
            <div className="blueprint-node__pin-group">
              <span style={{ width: 16 }} />
            </div>
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              {output.label && (
                <span className="blueprint-node__pin-label blueprint-node__pin-label--right">
                  {output.label}
                </span>
              )}
              {output.dataType === 'execution' ? (
                <ExecutionPin id={output.id} type="source" position={Position.Right} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
