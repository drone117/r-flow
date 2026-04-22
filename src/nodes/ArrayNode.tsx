/**
 * Array node component.
 *
 * Renders a typed array literal with a dynamic list of items. Each item
 * has an input pin on the left, a text label showing the index ([0], [1], ...),
 * and an inline value editor. Items can be added/removed with buttons.
 *
 * Key features:
 *   - `elementType` determines the type color and placeholder for each item
 *   - Items are stored in `data.items` as `{ id: string; value: string }[]`
 *   - The "Array" output pin on the right emits the entire array as a JSON string
 *   - During execution, `resolveOutputValue` serializes the items array to JSON
 *
 * The node uses a custom renderer because its layout is fundamentally different
 * from BaseNode — it has a dynamic number of input rows that can be added/removed.
 */
import { type NodeProps, Position, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { PIN_COLORS } from '../types';
import { DataPin } from '../pins/DataPin';
import { PinLabel } from '../pins/PinLabel';
import { useExecutionStore } from '../store/executionStore';
import './BaseNode.css';

/** A single item in the array. */
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
  const pinColor = PIN_COLORS[elementType as PinDataType] ?? '#aaaaaa';
  const displayType = (elementType as string).charAt(0).toUpperCase() + (elementType as string).slice(1);
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;

  /** Generic updater: applies a transformation to the node's data. */
  const updateData = (updater: (data: BlueprintNodeData) => BlueprintNodeData) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: updater(n.data as BlueprintNodeData) };
      }),
    );
  };

  /** Append a new empty item to the array. */
  const addItem = () => {
    updateData((d) => ({
      ...d,
      items: [
        ...((d.items as ArrayItem[]) ?? []),
        { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, value: '' },
      ],
    }));
  };

  /** Remove an item by its unique ID. */
  const removeItem = (itemId: string) => {
    updateData((d) => ({
      ...d,
      items: ((d.items as ArrayItem[]) ?? []).filter((i) => i.id !== itemId),
    }));
  };

  /** Update the value of a specific item. */
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
      className={`blueprint-node blueprint-node--collection ${isActive ? 'blueprint-node--executing' : ''}`}
      style={{ '--header-color': pinColor } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        {/* Type badge: shows element type + "[]" (e.g., "Float[]") */}
        <span className="blueprint-node__const-badge" style={{ background: pinColor }}>
          {displayType}[]
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {/* Render each array item as a row with input pin, label, editor, and remove button */}
        {(items as ArrayItem[]).map((item, idx) => (
          <div key={item.id} className="blueprint-node__row">
            <div className="blueprint-node__pin-group">
              <DataPin
                id={`item-${idx}-in`}
                type="target"
                dataType={elementType as PinDataType}
                position={Position.Left}
              />
              <PinLabel label={`[${idx}]`} side="left" />
              <input
                className="blueprint-node__pin-input nodrag"
                value={item.value}
                onChange={(e) => updateItemValue(item.id, e.target.value)}
                placeholder={elementType === 'string' ? '""' : elementType === 'bool' ? 'true' : '0'}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
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
          </div>
        ))}
        {/* Button to add a new item to the array */}
        <button
          className="blueprint-node__collection-add nodrag"
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
        >
          + Add Item
        </button>
        {/* Array output pin — emits the entire array as JSON */}
        <div className="blueprint-node__collection-output">
          <span className="blueprint-node__pin-label blueprint-node__pin-label--left">Array</span>
          <DataPin id="array-out" type="source" dataType={elementType as PinDataType} position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
