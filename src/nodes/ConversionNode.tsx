import { type NodeProps, Position } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { DataPin } from '../pins/DataPin';
import { NodeIcon } from '../components/NodeIcon';
import { useExecutionStore } from '../store/executionStore';
import './BaseNode.css';

export function ConversionNode({ id, data }: NodeProps) {
  const { label, inputs = [], outputs = [] } = data as BlueprintNodeData;
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;
  const inputType = inputs[0]?.dataType;
  const outputType = outputs[0]?.dataType;

  return (
    <div className={`blueprint-node ${isActive ? 'blueprint-node--executing' : ''}`} style={{ '--header-color': '#2a4a6b' } as React.CSSProperties}>
      <div className="blueprint-node__header">
        <span className="blueprint-node__header-icon">
          <NodeIcon category="conversion" />
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            {inputType && <DataPin id={inputs[0].id} type="target" dataType={inputType} position={Position.Left} />}
          </div>
          <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
            {outputType && <DataPin id={outputs[0].id} type="source" dataType={outputType} position={Position.Right} />}
          </div>
        </div>
      </div>
    </div>
  );
}
