/**
 * Constant node component.
 *
 * Renders a typed value constant (String, Float, Int, Bool, JSON) that
 * can be connected to data input pins on other nodes.
 *
 * The node's `dataType` field determines:
 *   - The header color (matches the pin color for that type)
 *   - The type badge shown in the header (e.g., "Float", "String[]")
 *   - The editor widget: text input for numeric/string, <select> for bool,
 *     <textarea> for JSON/array/map
 *
 * All constants store their value under the key "value" in `data.values`.
 * The output pin is always `value-out` on the right side.
 *
 * JSON constants have on-blur validation — the textarea border turns red
 * if the content isn't valid JSON.
 */
import { type NodeProps, Position } from '@xyflow/react';
import { useState } from 'react';
import type { BlueprintNodeData } from '../types';
import { PIN_COLORS } from '../types';
import type { PinDataType } from '../types';
import { DataPin } from '../pins/DataPin';
import { TYPE_LABELS } from '../utils/typeLabels';
import { useNodeValueUpdater, autoResizeTextarea } from '../hooks/useNodeHelpers';
import './BaseNode.css';

/** Header background color per type — matches the pin color system. */
const TYPE_HEADERS: Record<string, string> = {
  execution: '#ffffff',
  float: '#e8d44d',
  int: '#1bc6a0',
  string: '#f050a0',
  bool: '#cc0000',
  object: '#0066ff',
  wildcard: '#aaaaaa',
  array: '#7c6bc4',
  map: '#e08040',
  json: '#50c878',
};

/** Types that use a multi-line textarea instead of a single-line input. */
const MULTI_LINE_TYPES = new Set(['array', 'map', 'json']);

export function ConstantNode({ id, data }: NodeProps) {
  const { label, values = {} } = data as BlueprintNodeData;
  const dataType = (data.dataType as string) ?? 'string';
  const headerColor = TYPE_HEADERS[dataType] ?? '#aaaaaa';
  const value = values['value'] ?? '';
  const pinColor = PIN_COLORS[dataType as PinDataType] ?? '#aaaaaa';
  const isMultiLine = MULTI_LINE_TYPES.has(dataType);
  const isJson = dataType === 'json';
  const [jsonValid, setJsonValid] = useState(true);

  /** Update the stored value for this constant node. */
  const updateValue = useNodeValueUpdater(id);

  /** Placeholder text varies by data type to guide the user. */
  const placeholder = dataType === 'array'
    ? 'item1\nitem2\nitem3'
    : dataType === 'map'
      ? 'key1=value1\nkey2=value2'
      : dataType === 'json'
        ? '{"key": "value"}'
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
        {/* Type badge: colored pill showing the data type name */}
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
          // Multi-line textarea for JSON, array, and map types
          <textarea
            className={`blueprint-node__const-textarea nodrag ${isJson && !jsonValid ? 'blueprint-node__const-textarea--error' : ''}`}
            value={value}
            onChange={(e) => {
              updateValue('value', e.target.value);
              if (isJson) setJsonValid(true);
            }}
            onBlur={() => {
              // Validate JSON on blur — show red border if invalid
              if (isJson) {
                try { JSON.parse(value); setJsonValid(true); }
                catch { setJsonValid(false); }
              }
            }}
            placeholder={placeholder}
            rows={3}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => {
              autoResizeTextarea(e.currentTarget);
            }}
          />
        ) : dataType === 'bool' ? (
          // Boolean uses a dropdown (true/false) instead of free text
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group">
              <select
                className="blueprint-node__const-select nodrag"
                value={value}
                onChange={(e) => updateValue('value', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <DataPin id="value-out" type="source" dataType={dataType} position={Position.Right} />
            </div>
          </div>
        ) : (
          // Single-line text input for float, int, string
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group">
              <input
                className="blueprint-node__const-input"
                value={value}
                onChange={(e) => updateValue('value', e.target.value)}
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
        {/* For multi-line types, the output pin goes on its own row below the textarea */}
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
