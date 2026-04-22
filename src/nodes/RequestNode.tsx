/**
 * HTTP Request node component.
 *
 * A custom node for making HTTP requests during graph execution. Has a
 * unique layout compared to BaseNode because it needs:
 *   - Text inputs for URL, dropdown for method, textareas for params/body
 *   - JSON validation on blur for the params and body fields
 *   - Collapsible secondary output pins (headers, ok) — primary outputs
 *     (status, json, text) are always visible
 *
 * Architecture:
 *   - During execution, the executor sends a POST to `/api/request` with
 *     the user's URL, method, params, and body. The response is stored in
 *     `ctx.requestResults` and downstream nodes read it via `resolveOutputValue`.
 *   - The Vite dev server (or Go backend in production) proxies the actual
 *     HTTP request to avoid browser CORS restrictions.
 *
 * Collapsible pins:
 *   - The secondary outputs (Headers, OK) are always rendered in the DOM
 *     (required by React Flow for edge position calculation) but hidden
 *     with CSS `max-height: 0` and `overflow: hidden` when collapsed.
 *   - The toggle button switches between ▼ (collapsed) and ▲ (expanded).
 *
 * Input fields:
 *   - When a pin is connected (has an incoming edge), the inline editor
 *     is hidden — the value comes from the connected source instead.
 *   - The `connectedInputIds` set is derived from the current edges state.
 *   - JSON textareas auto-resize as the user types and show a red border
 *     on blur if the content isn't valid JSON.
 */
import { useState } from 'react';
import { type NodeProps, Position } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { DataPin } from '../pins/DataPin';
import { PinLabel } from '../pins/PinLabel';
import { NodeIcon } from '../components/NodeIcon';
import { useExecutionStore } from '../store/executionStore';
import { useNodeValueUpdater, useConnectedInputIds, autoResizeTextarea } from '../hooks/useNodeHelpers';
import './RequestNode.css';

/** Supported HTTP methods shown in the dropdown. */
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestNode({ id, data }: NodeProps) {
  const { label, values = {} } = data as BlueprintNodeData;
  const headerColor = CATEGORY_COLORS['function'];
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;
  const [expanded, setExpanded] = useState(false);
  const [paramsValid, setParamsValid] = useState(true);
  const [bodyValid, setBodyValid] = useState(true);

  /** Set of input pin IDs that have an incoming edge connected. */
  const connectedInputIds = useConnectedInputIds(id);

  /** Update a value in this node's data.values map. */
  const onValueChange = useNodeValueUpdater(id);

  /** Auto-resize a textarea to fit its content. */
  const onTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    autoResizeTextarea(e.currentTarget);
  };

  return (
    <div
      className={`blueprint-node blueprint-node--request ${isActive ? 'blueprint-node--executing' : ''}`}
      style={{ '--header-color': headerColor } as React.CSSProperties}
    >
      <div className="blueprint-node__header">
        <span className="blueprint-node__header-icon">
          <NodeIcon category="function" />
        </span>
        <span className="blueprint-node__header-label">{label}</span>
      </div>
      <div className="blueprint-node__body">
        {/* Execution flow pins: exec-in on the left, exec-out on the right */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <ExecutionPin id="exec-in" type="target" position={Position.Left} />
          </div>
          <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
            <ExecutionPin id="exec-out" type="source" position={Position.Right} />
          </div>
        </div>

        {/* URL input — accepts a string or can be connected externally */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <DataPin id="url" type="target" dataType="string" position={Position.Left} />
            <PinLabel label="URL" side="left" />
            {connectedInputIds.has('url') ? null : (
              <input
                className="blueprint-node__pin-input blueprint-node__pin-input--wide nodrag"
                value={values.url ?? ''}
                onChange={(e) => onValueChange('url', e.target.value)}
                placeholder="https://..."
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>

        {/* Method dropdown — GET, POST, PUT, PATCH, DELETE */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <DataPin id="method" type="target" dataType="string" position={Position.Left} />
            <PinLabel label="Method" side="left" />
            {connectedInputIds.has('method') ? null : (
              <select
                className="blueprint-node__pin-select nodrag"
                value={values.method ?? 'GET'}
                onChange={(e) => onValueChange('method', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Params textarea — expects a JSON object of query parameters */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <DataPin id="params" type="target" dataType="json" position={Position.Left} />
            <PinLabel label="Params" side="left" />
            {connectedInputIds.has('params') ? null : (
              <textarea
                className={`blueprint-node__request-textarea nodrag ${!paramsValid ? 'blueprint-node__request-textarea--error' : ''}`}
                value={values.params ?? '{}'}
                onChange={(e) => { onValueChange('params', e.target.value); setParamsValid(true); }}
                onBlur={() => {
                  // Validate JSON on blur
                  try { JSON.parse(values.params ?? '{}'); setParamsValid(true); }
                  catch { setParamsValid(false); }
                }}
                onInput={onTextareaInput}
                placeholder="{}"
                rows={2}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>

        {/* Body textarea — JSON body sent with POST/PUT/PATCH requests */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <DataPin id="body" type="target" dataType="json" position={Position.Left} />
            <PinLabel label="Body" side="left" />
            {connectedInputIds.has('body') ? null : (
              <textarea
                className={`blueprint-node__request-textarea nodrag ${!bodyValid ? 'blueprint-node__request-textarea--error' : ''}`}
                value={values.body ?? '{}'}
                onChange={(e) => { onValueChange('body', e.target.value); setBodyValid(true); }}
                onBlur={() => {
                  try { JSON.parse(values.body ?? '{}'); setBodyValid(true); }
                  catch { setBodyValid(false); }
                }}
                onInput={onTextareaInput}
                placeholder="{}"
                rows={2}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>

        {/* Primary output pins — always visible */}
        <div className="blueprint-node__output-section">
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <PinLabel label="Status" side="right" />
              <DataPin id="status" type="source" dataType="int" position={Position.Right} />
            </div>
          </div>
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <PinLabel label="JSON" side="right" />
              <DataPin id="json" type="source" dataType="json" position={Position.Right} />
            </div>
          </div>
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <PinLabel label="Text" side="right" />
              <DataPin id="text" type="source" dataType="string" position={Position.Right} />
            </div>
          </div>
        </div>

        {/* Collapse/expand toggle button */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group" />
          <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
            <button
              className="blueprint-node__collapse-btn nodrag"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Collapsible secondary outputs — always in DOM for React Flow edge calculation */}
        <div className={`blueprint-node__collapsed-section ${expanded ? 'expanded' : ''}`}>
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <PinLabel label="Headers" side="right" />
              <DataPin id="headers" type="source" dataType="json" position={Position.Right} />
            </div>
          </div>
          <div className="blueprint-node__row">
            <div className="blueprint-node__pin-group" />
            <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
              <PinLabel label="OK" side="right" />
              <DataPin id="ok" type="source" dataType="bool" position={Position.Right} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
