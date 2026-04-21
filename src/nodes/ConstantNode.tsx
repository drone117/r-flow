import { type NodeProps, Position, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { PIN_COLORS } from '../types';
import { DataPin } from '../pins/DataPin';
import './BaseNode.css';

type ConstType = string;

const TYPE_LABELS: Record<ConstType, string> = {
  execution: 'Exec',
  float: 'Float',
  int: 'Int',
  string: 'String',
  bool: 'Bool',
  object: 'Object',
  wildcard: 'Any',
  array: 'Array',
  map: 'Map',
};

const TYPE_HEADERS: Record<ConstType, string> = {
  execution: '#ffffff',
  float: '#e8d44d',
  int: '#1bc6a0',
  string: '#f050a0',
  bool: '#cc0000',
  object: '#0066ff',
  wildcard: '#aaaaaa',
  array: '#7c6bc4',
  map: '#e08040',
};

const MULTI_LINE_TYPES = new Set(['array', 'map']);

export function ConstantNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { label, values = {} } = data as BlueprintNodeData;
  const dataType = (data.dataType as ConstType) ?? 'string';
  const headerColor = TYPE_HEADERS[dataType] ?? '#aaaaaa';
  const value = values['value'] ?? '';
  const pinColor = PIN_COLORS[dataType as keyof typeof PIN_COLORS] ?? '#aaaaaa';
  const isMultiLine = MULTI_LINE_TYPES.has(dataType);

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

  const placeholder = dataType === 'array'
    ? 'item1\nitem2\nitem3'
    : dataType === 'map'
      ? 'key1=value1\nkey2=value2'
      : dataType === 'string'
        ? '""'
        : dataType === 'bool'
          ? 'true'
          : '0';

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
          {TYPE_LABELS[dataType] ?? dataType}
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {isMultiLine ? (
          <textarea
            className="blueprint-node__const-textarea nodrag"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
          />
        ) : (
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group">
              <input
                className="blueprint-node__const-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={placeholder}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <DataPin id="value-out" type="source" dataType={dataType} position={Position.Right} />
            </div>
          </div>
        )}
        {isMultiLine && (
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <DataPin id="value-out" type="source" dataType={dataType} position={Position.Right} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
