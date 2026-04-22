import type { Node, Edge } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { convertValue } from '../utils/conversionUtils';

interface ExecCtx {
  nodes: Node[];
  edges: Edge[];
  emit: (msg: string) => void;
  onNodeActive: (nodeId: string) => void;
  onEdgeActive: (edgeId: string) => void;
  delay: number;
  loopIndex: Map<string, number>;
  loopValue: Map<string, string>;
  requestResults: Map<string, { status: number; headers: string; json: string; text: string; ok: boolean }>;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveInputValue(ctx: ExecCtx, nodeId: string, handleId: string): string {
  const edge = ctx.edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId,
  );

  if (edge) {
    return resolveOutputValue(ctx, edge.source, edge.sourceHandle!);
  }

  const node = ctx.nodes.find((n) => n.id === nodeId);
  const data = node?.data as BlueprintNodeData | undefined;
  return data?.values?.[handleId] ?? '';
}

function resolveInputType(ctx: ExecCtx, nodeId: string, handleId: string): PinDataType {
  const edge = ctx.edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId,
  );
  if (edge) {
    return (edge.data as { dataType?: PinDataType }).dataType ?? 'wildcard';
  }
  return 'wildcard';
}

function resolveOutputValue(
  ctx: ExecCtx,
  nodeId: string,
  handleId: string,
): string {
  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return '';
  const data = node.data as BlueprintNodeData;

  if (data.category === 'variable' || node.type === 'constantNode') {
    return data.values?.[handleId] ?? data.values?.['value'] ?? '';
  }

  if (data.category === 'pure' && data.label === 'Format Text') {
    const format = resolveInputValue(ctx, nodeId, 'format');
    const arg1 = resolveInputValue(ctx, nodeId, 'arg1');
    return format.replace(/\{0\}/g, arg1);
  }

  if (data.category === 'conversion') {
    const sourceType = data.sourceType as PinDataType;
    const targetType = data.targetType as PinDataType;
    const inputValue = resolveInputValue(ctx, nodeId, 'value-in');
    return convertValue(inputValue, sourceType, targetType);
  }

  if (data.category === 'loop' && handleId === 'index') {
    return String(ctx.loopIndex.get(nodeId) ?? '');
  }

  if (data.category === 'loop' && handleId === 'value') {
    return ctx.loopValue.get(nodeId) ?? '';
  }

  if (data.category === 'math') {
    const aPin = data.inputs?.[0]?.id ?? 'a';
    const bPin = data.inputs?.[1]?.id ?? 'b';
    const aVal = resolveInputValue(ctx, nodeId, aPin);
    const bVal = resolveInputValue(ctx, nodeId, bPin);
    const aType = resolveInputType(ctx, nodeId, aPin);
    const bType = resolveInputType(ctx, nodeId, bPin);

    if (data.label === 'Clamp') {
      return String(Math.max(parseFloat(bVal) || 0, parseFloat(aVal) || 0));
    }

    if (data.label === 'Multiply') {
      return String((parseFloat(aVal) || 0) * (parseFloat(bVal) || 0));
    }

    // Add: concatenate if either input is string, otherwise numeric
    if (aType === 'string' || bType === 'string') {
      return aVal + bVal;
    }
    return String((parseFloat(aVal) || 0) + (parseFloat(bVal) || 0));
  }

  if (node.type === 'arrayNode' && 'items' in data) {
    const items = (data.items as { id: string; value: string }[]) ?? [];
    return JSON.stringify(items.map((i) => i.value));
  }

  if (node.type === 'requestNode') {
    const result = ctx.requestResults.get(nodeId);
    if (!result) return '';
    switch (handleId) {
      case 'status': return String(result.status);
      case 'json': return result.json;
      case 'text': return result.text;
      case 'headers': return result.headers;
      case 'ok': return result.ok ? 'true' : 'false';
      default: return '';
    }
  }

  return data.values?.[handleId] ?? '';
}

function followExecAll(ctx: ExecCtx, nodeId: string, handleId: string): { targetId: string; edgeId: string }[] {
  return ctx.edges
    .filter((e) => e.source === nodeId && e.sourceHandle === handleId)
    .map((e) => ({ targetId: e.target, edgeId: e.id }));
}

async function executeNode(
  ctx: ExecCtx,
  nodeId: string,
  ancestors: Set<string>,
  steps: { count: number },
): Promise<void> {
  if (!nodeId || steps.count >= 1000) return;
  if (ancestors.has(nodeId)) {
    ctx.emit('  ⚠ Infinite loop detected — stopping.');
    return;
  }

  ancestors.add(nodeId);
  steps.count++;

  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  const data = node.data as BlueprintNodeData;

  ctx.onNodeActive(nodeId);
  await wait(ctx.delay);

  switch (data.category) {
    case 'function': {
      if (data.label === 'Print String') {
        const value = resolveInputValue(ctx, nodeId, 'string-in');
        ctx.emit(value || '(empty string)');
      }
      if (data.label === 'Delay') {
        const duration = parseFloat(resolveInputValue(ctx, nodeId, 'duration')) || 0;
        await wait(duration * 1000);
      }
      if (data.label === 'HTTP Request') {
        const url = resolveInputValue(ctx, nodeId, 'url');
        const method = resolveInputValue(ctx, nodeId, 'method') || 'GET';
        let paramsObj: Record<string, string> = {};
        try { paramsObj = JSON.parse(resolveInputValue(ctx, nodeId, 'params') || '{}'); } catch { /* ignore */ }

        let fetchBody: string | undefined;
        if (method !== 'GET' && method !== 'HEAD') {
          const rawBody = resolveInputValue(ctx, nodeId, 'body');
          if (rawBody) fetchBody = rawBody;
        }

        try {
          ctx.emit(`  → ${method} ${url}`);
          const response = await fetch('/api/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, method, params: paramsObj, body: fetchBody }),
          });
          const result = await response.json() as { status: number; headers: Record<string, string>; body: string; ok: boolean };
          let jsonStr = '';
          try { const parsed = JSON.parse(result.body); jsonStr = JSON.stringify(parsed); } catch { /* not JSON */ }

          ctx.requestResults.set(nodeId, {
            status: result.status,
            headers: JSON.stringify(result.headers),
            json: jsonStr,
            text: result.body,
            ok: result.ok,
          });
          ctx.emit(`  ← ${result.status}`);
        } catch (err) {
          ctx.requestResults.set(nodeId, {
            status: 0,
            headers: '{}',
            json: '',
            text: '',
            ok: false,
          });
          ctx.emit(`  ✗ Request failed: ${err instanceof TypeError ? 'CORS — the server does not allow cross-origin requests from the browser' : err}`);
        }
      }
      for (const t of followExecAll(ctx, nodeId, 'exec-out')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    case 'branch': {
      const condition = resolveInputValue(ctx, nodeId, 'condition');
      const isTrue = condition !== '' && condition !== 'false' && condition !== '0';
      for (const t of followExecAll(ctx, nodeId, isTrue ? 'true' : 'false')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    case 'loop': {
      if (data.label === 'For Each Loop') {
        const rawArray = resolveInputValue(ctx, nodeId, 'array');
        let elements: string[] = [];
        try { elements = JSON.parse(rawArray); } catch { /* not a valid array */ }
        for (let i = 0; i < elements.length; i++) {
          ctx.loopIndex.set(nodeId, i);
          ctx.loopValue.set(nodeId, elements[i]);
          for (const t of followExecAll(ctx, nodeId, 'body')) {
            if (t.edgeId) ctx.onEdgeActive(t.edgeId);
            await executeNode(ctx, t.targetId, new Set(ancestors), steps);
          }
        }
        ctx.loopIndex.delete(nodeId);
        ctx.loopValue.delete(nodeId);
      } else {
        const first = parseInt(resolveInputValue(ctx, nodeId, 'first-index'), 10) || 0;
        const last = parseInt(resolveInputValue(ctx, nodeId, 'last-index'), 10) || 0;
        for (let i = first; i <= last; i++) {
          ctx.loopIndex.set(nodeId, i);
          for (const t of followExecAll(ctx, nodeId, 'body')) {
            if (t.edgeId) ctx.onEdgeActive(t.edgeId);
            await executeNode(ctx, t.targetId, new Set(ancestors), steps);
          }
        }
        ctx.loopIndex.delete(nodeId);
      }
      for (const t of followExecAll(ctx, nodeId, 'completed')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    case 'event':
    case 'start':
    default: {
      for (const t of followExecAll(ctx, nodeId, 'exec-out')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }
  }
}

export async function executeGraph(
  nodes: Node[],
  edges: Edge[],
  onOutput: (msg: string) => void,
  onNodeActive: (nodeId: string) => void,
  onEdgeActive: (edgeId: string) => void,
  stepDelay = 300,
) {
  const ctx: ExecCtx = { nodes, edges, emit: onOutput, onNodeActive, onEdgeActive, delay: stepDelay, loopIndex: new Map(), loopValue: new Map(), requestResults: new Map() };

  const startNodes = nodes.filter(
    (n) => n.type === 'startNode',
  );

  if (startNodes.length === 0) {
    onOutput('No Start node found on the canvas.');
    return;
  }

  for (const startNode of startNodes) {
    const label = (startNode.data as BlueprintNodeData).label;
    onOutput(`▶ Executing from "${label}"`);

    const steps = { count: 0 };
    await executeNode(ctx, startNode.id, new Set(), steps);

    if (steps.count >= 1000) {
      onOutput('  ⚠ Max execution steps reached — stopping.');
    }
  }
}
