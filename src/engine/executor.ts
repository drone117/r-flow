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
    const a = resolveInputValue(ctx, nodeId, data.inputs?.[0]?.id ?? 'a');
    const b = resolveInputValue(ctx, nodeId, data.inputs?.[1]?.id ?? 'b');
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    if (data.label.includes('+')) return String(numA + numB);
    if (data.label.includes('*')) return String(numA * numB);
    if (data.label.includes('Clamp')) {
      const val = numA;
      const min = numB;
      return String(Math.max(min, val));
    }
    return String(numA + numB);
  }

  if (node.type === 'arrayNode' && 'items' in data) {
    const items = (data.items as { id: string; value: string }[]) ?? [];
    return JSON.stringify(items.map((i) => i.value));
  }

  return data.values?.[handleId] ?? '';
}

function followExec(ctx: ExecCtx, nodeId: string, handleId: string): { targetId: string | null; edgeId: string | null } {
  const edge = ctx.edges.find(
    (e) => e.source === nodeId && e.sourceHandle === handleId,
  );
  return { targetId: edge?.target ?? null, edgeId: edge?.id ?? null };
}

async function processNode(ctx: ExecCtx, nodeId: string): Promise<string | null> {
  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const data = node.data as BlueprintNodeData;

  ctx.onNodeActive(nodeId);
  await wait(ctx.delay);

  switch (data.category) {
    case 'function': {
      if (data.label === 'Print String') {
        const value = resolveInputValue(ctx, nodeId, 'string-in');
        ctx.emit(value || '(empty string)');
      }
      const next = followExec(ctx, nodeId, 'exec-out');
      if (next.edgeId) ctx.onEdgeActive(next.edgeId);
      return next.targetId;
    }

    case 'branch': {
      const condition = resolveInputValue(ctx, nodeId, 'condition');
      const isTrue = condition !== '' && condition !== 'false' && condition !== '0';
      const next = followExec(ctx, nodeId, isTrue ? 'true' : 'false');
      if (next.edgeId) ctx.onEdgeActive(next.edgeId);
      return next.targetId;
    }

    case 'loop': {
      if (data.label === 'For Each Loop') {
        const rawArray = resolveInputValue(ctx, nodeId, 'array');
        let elements: string[] = [];
        try { elements = JSON.parse(rawArray); } catch { /* not a valid array */ }
        for (let i = 0; i < elements.length; i++) {
          ctx.loopIndex.set(nodeId, i);
          ctx.loopValue.set(nodeId, elements[i]);
          const bodyNext = followExec(ctx, nodeId, 'body');
          if (bodyNext.targetId) {
            if (bodyNext.edgeId) ctx.onEdgeActive(bodyNext.edgeId);
            await processNode(ctx, bodyNext.targetId);
          }
        }
        ctx.loopIndex.delete(nodeId);
        ctx.loopValue.delete(nodeId);
      } else {
        const first = parseInt(resolveInputValue(ctx, nodeId, 'first-index'), 10) || 0;
        const last = parseInt(resolveInputValue(ctx, nodeId, 'last-index'), 10) || 0;
        for (let i = first; i <= last; i++) {
          ctx.loopIndex.set(nodeId, i);
          const bodyNext = followExec(ctx, nodeId, 'body');
          if (bodyNext.targetId) {
            if (bodyNext.edgeId) ctx.onEdgeActive(bodyNext.edgeId);
            await processNode(ctx, bodyNext.targetId);
          }
        }
        ctx.loopIndex.delete(nodeId);
      }
      const completed = followExec(ctx, nodeId, 'completed');
      if (completed.edgeId) ctx.onEdgeActive(completed.edgeId);
      return completed.targetId;
    }

    case 'event':
    case 'start': {
      const next = followExec(ctx, nodeId, 'exec-out');
      if (next.edgeId) ctx.onEdgeActive(next.edgeId);
      return next.targetId;
    }

    default: {
      const next = followExec(ctx, nodeId, 'exec-out');
      if (next.edgeId) ctx.onEdgeActive(next.edgeId);
      return next.targetId;
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
  const ctx: ExecCtx = { nodes, edges, emit: onOutput, onNodeActive, onEdgeActive, delay: stepDelay, loopIndex: new Map(), loopValue: new Map() };

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

    let currentId: string | null = startNode.id;
    const visited = new Set<string>();
    let steps = 0;
    const maxSteps = 1000;

    while (currentId && steps < maxSteps) {
      if (visited.has(currentId)) {
        onOutput('  ⚠ Infinite loop detected — stopping.');
        break;
      }
      visited.add(currentId);
      steps++;
      currentId = await processNode(ctx, currentId);
    }

    if (steps >= maxSteps) {
      onOutput('  ⚠ Max execution steps reached — stopping.');
    }
  }
}
