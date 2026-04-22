import { useState } from 'react';
import { type NodeProps, Position, useReactFlow, useStore } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { ExecutionPin } from '../pins/ExecutionPin';
import { DataPin } from '../pins/DataPin';
import { PinLabel } from '../pins/PinLabel';
import { NodeIcon } from '../components/NodeIcon';
import { useExecutionStore } from '../store/executionStore';
import './RequestNode.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function RequestNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow();
  const { label, values = {} } = data as BlueprintNodeData;
  const headerColor = CATEGORY_COLORS['function'];
  const activeNodeId = useExecutionStore((s) => s.activeNodeId);
  const isActive = activeNodeId === id;
  const [expanded, setExpanded] = useState(false);
  const [paramsValid, setParamsValid] = useState(true);
  const [bodyValid, setBodyValid] = useState(true);

  const connectedInputIds = useStore((s) => {
    const ids = new Set<string>();
    for (const e of s.edges) {
      if (e.target === id) ids.add(e.targetHandle!);
    }
    return ids;
  });

  const onValueChange = (pinId: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            values: { ...(n.data as BlueprintNodeData).values, [pinId]: value },
          },
        };
      }),
    );
  };

  const onTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
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
        {/* Execution input */}
        <div className="blueprint-node__row">
          <div className="blueprint-node__pin-group">
            <ExecutionPin id="exec-in" type="target" position={Position.Left} />
          </div>
          <div className="blueprint-node__pin-group blueprint-node__pin-group--right">
            <ExecutionPin id="exec-out" type="source" position={Position.Right} />
          </div>
        </div>

        {/* URL */}
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

        {/* Method */}
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

        {/* Params */}
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

        {/* Body */}
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

        {/* Primary outputs */}
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

        {/* Collapse toggle */}
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

        {/* Collapsible secondary outputs — handles always in DOM for edge calculation */}
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
