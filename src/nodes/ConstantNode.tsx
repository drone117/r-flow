import { type NodeProps, Position, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { PIN_COLORS } from '../types';
import { DataPin } from '../pins/DataPin';
import './BaseNode.css';

const TYPE_LABELS: Record<PinDataType, string> = {
  execution: 'Exec',
  float: 'Float',
  int: 'Int',
  string: 'String',
  bool: 'Bool',
  object: 'Object',
  wildcard: 'Any',
};

const TYPE_HEADERS: Record<PinDataType, string> = {
  execution: '#ffffff',
  float: '#e8d44d',
  int: '#1bc6a0',
  string: '#f050a0',
  bool: '#cc0000',
  object: '#0066ff',
  wildcard: '#aaaaaa',
};

export function ConstantNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { label, values = {} } = data as BlueprintNodeData;
  const dataType = (data.dataType as PinDataType) ?? 'string';
  const headerColor = TYPE_HEADERS[dataType];
  const value = values['value'] ?? '';
  const pinColor = PIN_COLORS[dataType];

  const onValueChange = (val: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            values: { ...(n.data as BlueprintNodeData).values, value: val },
          },
        };
      }),
    );
  };

  return (
    <div
      className="blueprint-node blueprint-node--constant"
      style={{ '--header-color': headerColor } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        <span
          className="blueprint-node__const-badge"
          style={{ background: pinColor }}
        >
          {TYPE_LABELS[dataType]}
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <input
              className="blueprint-node__const-input"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={dataType === 'string' ? '""' : dataType === 'bool' ? 'true' : '0'}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
            <DataPin id="value-out" type="source" dataType={dataType} position={Position.Right} />
          </div>
        </div>
      </div>
    </div>
  );
}
