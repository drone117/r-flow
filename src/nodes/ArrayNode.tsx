import { type NodeProps, Position, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { PIN_COLORS } from '../types';
import { DataPin } from '../pins/DataPin';
import './BaseNode.css';

const ELEMENT_COLORS: Record<string, string> = {
  string: '#f050a0',
  float: '#e8d44d',
  int: '#1bc6a0',
  bool: '#cc0000',
  object: '#0066ff',
};

interface ArrayItem {
  id: string;
  value: string;
}

export function ArrayNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { label, elementType = 'int', items = [] } = data as BlueprintNodeData & {
    elementType?: string;
    items?: ArrayItem[];
  };
  const pinColor = ELEMENT_COLORS[elementType] ?? '#aaaaaa';
  const displayType = (elementType as string).charAt(0).toUpperCase() + (elementType as string).slice(1);

  const updateData = (updater: (data: BlueprintNodeData) => BlueprintNodeData) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: updater(n.data as BlueprintNodeData) };
      }),
    );
  };

  const addItem = () => {
    updateData((d) => ({
      ...d,
      items: [
        ...((d.items as ArrayItem[]) ?? []),
        { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, value: '' },
      ],
    }));
  };

  const removeItem = (itemId: string) => {
    updateData((d) => ({
      ...d,
      items: ((d.items as ArrayItem[]) ?? []).filter((i) => i.id !== itemId),
    }));
  };

  const updateItemValue = (itemId: string, value: string) => {
    updateData((d) => ({
      ...d,
      items: ((d.items as ArrayItem[]) ?? []).map((i) =>
        i.id === itemId ? { ...i, value } : i,
      ),
    }));
  };

  return (
    <div
      className="blueprint-node blueprint-node--collection"
      style={{ '--header-color': pinColor } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        <span className="blueprint-node__const-badge" style={{ background: pinColor }}>
          {displayType}[]
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {(items as ArrayItem[]).map((item, idx) => (
          <div key={item.id} className="blueprint-node__collection-row">
            <span className="blueprint-node__collection-idx">{idx}</span>
            <DataPin
              id={`item-${idx}-in`}
              type="target"
              dataType={elementType as PinDataType}
              position={Position.Left}
            />
            <input
              className="blueprint-node__collection-input nodrag"
              value={item.value}
              onChange={(e) => updateItemValue(item.id, e.target.value)}
              placeholder={elementType === 'string' ? '""' : elementType === 'bool' ? 'true' : '0'}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button
              className="blueprint-node__collection-remove nodrag"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="blueprint-node__collection-add nodrag"
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
        >
          + Add Item
        </button>
        <div className="blueprint-node__collection-output">
          <span className="blueprint-node__pin-label blueprint-node__pin-label--left">Array</span>
          <DataPin id="array-out" type="source" dataType={elementType as PinDataType} position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
