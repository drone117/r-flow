import { type NodeProps, Position, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { DataPin } from '../pins/DataPin';
import './BaseNode.css';

interface MapEntry {
  id: string;
  key: string;
  value: string;
}

export function MapNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { label, keyType = 'string', valueType = 'int', entries = [] } = data as BlueprintNodeData & {
    keyType?: string;
    valueType?: string;
    entries?: MapEntry[];
  };
  const keyColor = '#f050a0';
  const valueColor = '#e8d44d';

  const updateData = (updater: (data: BlueprintNodeData) => BlueprintNodeData) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: updater(n.data as BlueprintNodeData) };
      }),
    );
  };

  const addEntry = () => {
    updateData((d) => ({
      ...d,
      entries: [
        ...((d.entries as MapEntry[]) ?? []),
        { id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, key: '', value: '' },
      ],
    }));
  };

  const removeEntry = (entryId: string) => {
    updateData((d) => ({
      ...d,
      entries: ((d.entries as MapEntry[]) ?? []).filter((e) => e.id !== entryId),
    }));
  };

  const updateEntry = (entryId: string, field: 'key' | 'value', val: string) => {
    updateData((d) => ({
      ...d,
      entries: ((d.entries as MapEntry[]) ?? []).map((e) =>
        e.id === entryId ? { ...e, [field]: val } : e,
      ),
    }));
  };

  const displayKeyType = (keyType as string).charAt(0).toUpperCase() + (keyType as string).slice(1);
  const displayValueType = (valueType as string).charAt(0).toUpperCase() + (valueType as string).slice(1);

  return (
    <div
      className="blueprint-node blueprint-node--collection"
      style={{ '--header-color': '#e08040' } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        <span className="blueprint-node__const-badge" style={{ background: '#e08040' }}>
          Map
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        <div className="blueprint-node__map-legend">
          <span className="blueprint-node__map-type-label" style={{ color: keyColor }}>
            Key ({displayKeyType})
          </span>
          <span className="blueprint-node__map-type-sep">→</span>
          <span className="blueprint-node__map-type-label" style={{ color: valueColor }}>
            Value ({displayValueType})
          </span>
        </div>
        {(entries as MapEntry[]).map((entry, idx) => (
          <div key={entry.id} className="blueprint-node__map-row">
            <span className="blueprint-node__collection-idx">{idx}</span>
            <div className="blueprint-node__map-field">
              <DataPin
                id={`entry-${idx}-key-in`}
                type="target"
                dataType={keyType as PinDataType}
                position={Position.Left}
              />
              <input
                className="blueprint-node__map-input nodrag"
                value={entry.key}
                onChange={(e) => updateEntry(entry.id, 'key', e.target.value)}
                placeholder="key"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="blueprint-node__map-field">
              <input
                className="blueprint-node__map-input nodrag"
                value={entry.value}
                onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                placeholder="value"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <DataPin
                id={`entry-${idx}-value-in`}
                type="target"
                dataType={valueType as PinDataType}
                position={Position.Right}
              />
            </div>
            <button
              className="blueprint-node__collection-remove nodrag"
              onClick={(e) => {
                e.stopPropagation();
                removeEntry(entry.id);
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
            addEntry();
          }}
        >
          + Add Entry
        </button>
        <div className="blueprint-node__collection-output">
          <span className="blueprint-node__pin-label blueprint-node__pin-label--left">Map</span>
          <DataPin id="map-out" type="source" dataType="wildcard" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
