/**
 * Start node component.
 *
 * Entry point for graph execution. Unlike other nodes, Start nodes have
 * NO input pins — only an execution output pin. The executor finds all
 * Start nodes and begins execution from each one.
 *
 * This is a custom renderer (not using BaseNode) because Start nodes
 * have a unique layout: no inputs, only outputs on the right side.
 */
import { type NodeProps, Position } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { NodeIcon } from '../components/NodeIcon';
import { useExecutionStore } from '../store/executionStore';
import './BaseNode.css';

export function StartNode({ id, data }: NodeProps) {
  const { label, outputs = [] } = data as BlueprintNodeData;
  const headerColor = CATEGORY_COLORS['start'];
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;

  return (
    <div
      className={`blueprint-node ${isActive ? 'blueprint-node--executing' : ''}`}
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
            {/* Empty spacer on the left side — Start nodes have no inputs */}
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
