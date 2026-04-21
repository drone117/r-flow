import type { Node, Edge } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';

interface ExecCtx {
  nodes: Node[];
  edges: Edge[];
  emit: (msg: string) => void;
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

  return data.values?.[handleId] ?? '';
}

function followExec(ctx: ExecCtx, nodeId: string, handleId: string): string | null {
  const edge = ctx.edges.find(
    (e) => e.source === nodeId && e.sourceHandle === handleId,
  );
  return edge?.target ?? null;
}

function processNode(ctx: ExecCtx, nodeId: string): string | null {
  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const data = node.data as BlueprintNodeData;

  switch (data.category) {
    case 'function': {
      if (data.label === 'Print String') {
        const value = resolveInputValue(ctx, nodeId, 'string-in');
        ctx.emit(value || '(empty string)');
      }
      return followExec(ctx, nodeId, 'exec-out');
    }

    case 'branch': {
      const condition = resolveInputValue(ctx, nodeId, 'condition');
      const isTrue = condition !== '' && condition !== 'false' && condition !== '0';
      return followExec(ctx, nodeId, isTrue ? 'true' : 'false');
    }

    case 'loop': {
      const first = parseInt(resolveInputValue(ctx, nodeId, 'first-index'), 10) || 0;
      const last = parseInt(resolveInputValue(ctx, nodeId, 'last-index'), 10) || 0;
      for (let i = first; i <= last; i++) {
        const bodyTarget = followExec(ctx, nodeId, 'body');
        if (bodyTarget) {
          processNode(ctx, bodyTarget);
        }
      }
      return followExec(ctx, nodeId, 'completed');
    }

    case 'event':
    case 'start':
      return followExec(ctx, nodeId, 'exec-out');

    default:
      return followExec(ctx, nodeId, 'exec-out') ?? null;
  }
}

export function executeGraph(
  nodes: Node[],
  edges: Edge[],
  onOutput: (msg: string) => void,
) {
  const ctx: ExecCtx = { nodes, edges, emit: onOutput };

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
      currentId = processNode(ctx, currentId);
    }

    if (steps >= maxSteps) {
      onOutput('  ⚠ Max execution steps reached — stopping.');
    }
  }
}
