import { type NodeProps, Position } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { DataPin } from '../pins/DataPin';
import { PinLabel } from '../pins/PinLabel';
import { NodeIcon } from '../components/NodeIcon';
import './BaseNode.css';

interface BaseNodeProps extends NodeProps {
  data: BlueprintNodeData;
}

export function BaseNode({ data, selected }: BaseNodeProps) {
  const { label, category, inputs = [], outputs = [], icon } = data;
  const headerColor = CATEGORY_COLORS[category] ?? '#3a3a5c';

  const maxRows = Math.max(inputs.length, outputs.length, 1);

  return (
    <div
      className={`blueprint-node ${category === 'comment' ? 'blueprint-node--comment' : ''}`}
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
                  <ExecutionPin
                    id={input.id}
                    type="target"
                    position={Position.Left}
                  />
                )}
                {input && input.dataType !== 'execution' && (
                  <DataPin
                    id={input.id}
                    type="target"
                    dataType={input.dataType}
                    position={Position.Left}
                  />
                )}
                {input && <PinLabel label={input.label} side="left" />}
              </div>
              <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
                {output && <PinLabel label={output.label} side="right" />}
                {output && output.dataType === 'execution' && (
                  <ExecutionPin
                    id={output.id}
                    type="source"
                    position={Position.Right}
                  />
                )}
                {output && output.dataType !== 'execution' && (
                  <DataPin
                    id={output.id}
                    type="source"
                    dataType={output.dataType}
                    position={Position.Right}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
