/**
 * Graph execution engine.
 *
 * Walks the blueprint graph from Start nodes, following execution pins
 * (white wires), and runs each node's logic. Data pins (colored wires) are
 * resolved on-demand when a node needs an input value.
 *
 * Execution model:
 *   - Recursive: when an execution pin fans out to multiple targets,
 *     ALL branches are executed sequentially.
 *   - Each branch gets its own "ancestors" set. If a node appears twice
 *     on the SAME branch, that's an infinite loop. But a node can safely
 *     appear on different branches (diamond patterns).
 *   - A shared step counter prevents runaway execution (>1000 steps total).
 *   - An animation delay (default 300ms) highlights each node as it runs.
 *
 * Value resolution:
 *   - resolveInputValue(nodeId, pinId) → follows the edge to the source
 *     node and returns its output value. If no edge, returns the user's
 *     typed value from the node's data.values.
 *   - resolveOutputValue(nodeId, pinId) → computes the node's output based
 *     on its type (math computes, constants return stored values, etc.).
 *
 * HTTP requests:
 *   - Sent to /api/request (proxied by a Vite plugin to avoid CORS).
 *   - Results are stored in requestResults map so downstream nodes can
 *     read them via resolveOutputValue.
 */

import type { Node, Edge } from '@xyflow/react';
import type { BlueprintNodeData, PinDataType } from '../types';
import { convertValue } from '../utils/conversionUtils';

/**
 * Shared execution context, passed to every function in this module.
 * Created fresh for each execution run.
 */
interface ExecCtx {
  nodes: Node[];     // The current graph snapshot
  edges: Edge[];     // The current edge snapshot
  emit: (msg: string) => void;           // Print to the output console
  onNodeActive: (nodeId: string) => void; // Highlight a node during execution
  onEdgeActive: (edgeId: string) => void; // Highlight an edge during execution
  delay: number;     // Milliseconds to pause on each node (for animation)

  // Per-node state (keyed by node ID):
  loopIndex: Map<string, number>;   // Current loop iteration index
  loopValue: Map<string, string>;   // Current loop element value
  requestResults: Map<string, {     // HTTP response data
    status: number;
    headers: string;  // JSON-stringified headers object
    json: string;    // Pretty-printed JSON (or '' if not JSON)
    text: string;    // Raw response body
    ok: boolean;
  }>;
}

/** Promise-based sleep utility, used for animation delay between nodes. */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the current value of a node's input pin.
 *
 * Strategy:
 *   1. If an edge is connected to this pin → follow it to the source
 *      node and recursively resolve its output value.
 *   2. If no edge (pin is unconnected) → return the value the user
 *      typed into the node's inline input field.
 */
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

/**
 * Get the resolved PinDataType of a node's input pin by looking at
 * the connected edge's dataType field. Returns 'wildcard' if unconnected.
 */
function resolveInputType(ctx: ExecCtx, nodeId: string, handleId: string): PinDataType {
  const edge = ctx.edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId,
  );
  if (edge) {
    return (edge.data as { dataType?: PinDataType }).dataType ?? 'wildcard';
  }
  return 'wildcard';
}

/**
 * Compute the output value of a specific pin on a node.
 *
 * This is the heart of the execution engine — every data pin ultimately
 * resolves through this function.
 *
 * The function dispatches based on node type/category:
 *   - Constants/variables → return their stored value
 *   - Format Text → substitute {0} with arg1
 *   - Conversion nodes → convert the input value to the target type
 *   - Loop nodes → return current index or element value from ctx
 *   - Math nodes → compute based on operator and input types
 *   - Array nodes → serialize items to JSON
 *   - HTTP Request nodes → return stored response data from ctx
 *   - Fallback → return the stored value for that pin, or empty string
 */
function resolveOutputValue(
  ctx: ExecCtx,
  nodeId: string,
  handleId: string,
): string {
  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return '';
  const data = node.data as BlueprintNodeData;

  // Constants and variables: just return the stored value
  if (data.category === 'variable' || node.type === 'constantNode') {
    return data.values?.[handleId] ?? data.values?.['value'] ?? '';
  }

  // Format Text: "Hello {0}!" + arg1="World" → "Hello World!"
  if (data.category === 'pure' && data.label === 'Format Text') {
    const format = resolveInputValue(ctx, nodeId, 'format');
    const arg1 = resolveInputValue(ctx, nodeId, 'arg1');
    return format.replace(/\{0\}/g, arg1);
  }

  // Conversion nodes: convert input value using conversionUtils
  if (data.category === 'conversion') {
    const sourceType = data.sourceType as PinDataType;
    const targetType = data.targetType as PinDataType;
    const inputValue = resolveInputValue(ctx, nodeId, 'value-in');
    return convertValue(inputValue, sourceType, targetType);
  }

  // Loop nodes: return the current iteration index or element value
  if (data.category === 'loop' && handleId === 'index') {
    return String(ctx.loopIndex.get(nodeId) ?? '');
  }
  if (data.category === 'loop' && handleId === 'value') {
    return ctx.loopValue.get(nodeId) ?? '';
  }

  // Math nodes: compute based on the operator
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
    // Add: concatenate if either input is string, otherwise numeric addition
    if (aType === 'string' || bType === 'string') {
      return aVal + bVal;
    }
    return String((parseFloat(aVal) || 0) + (parseFloat(bVal) || 0));
  }

  // Array nodes: serialize the items array to a JSON string
  if (node.type === 'arrayNode' && 'items' in data) {
    const items = (data.items as { id: string; value: string }[]) ?? [];
    return JSON.stringify(items.map((i) => i.value));
  }

  // HTTP Request nodes: return stored response from the requestResults map
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

  // Fallback: return the stored value for this pin, or empty string
  return data.values?.[handleId] ?? '';
}

/**
 * Find ALL edges leaving a specific execution pin.
 * Returns an array so that fan-out (one output → multiple inputs) works.
 */
function followExecAll(ctx: ExecCtx, nodeId: string, handleId: string): { targetId: string; edgeId: string }[] {
  return ctx.edges
    .filter((e) => e.source === nodeId && e.sourceHandle === handleId)
    .map((e) => ({ targetId: e.target, edgeId: e.id }));
}

/**
 * Recursively execute a node and all downstream nodes.
 *
 * This function:
 *   1. Checks for infinite loops (node already on current branch)
 *   2. Pauses for animation delay
 *   3. Performs the node's action (print, delay, fetch, etc.)
 *   4. Finds all edges from the node's execution output pin
 *   5. Recursively calls itself for each target
 *
 * The `ancestors` set is copied for each branch (new Set(ancestors)),
 * so different branches can visit the same node without triggering
 * the infinite loop detector.
 *
 * The `steps` object is shared across all branches to enforce a global
 * maximum step count.
 */
async function executeNode(
  ctx: ExecCtx,
  nodeId: string,
  ancestors: Set<string>,
  steps: { count: number },
): Promise<void> {
  // Safety limits
  if (!nodeId || steps.count >= 1000) return;

  // Infinite loop detection: if this node is already on the current
  // execution path, we'd loop forever
  if (ancestors.has(nodeId)) {
    ctx.emit('  ⚠ Infinite loop detected — stopping.');
    return;
  }

  ancestors.add(nodeId);
  steps.count++;

  const node = ctx.nodes.find((n) => n.id === nodeId);
  if (!node) return;
  const data = node.data as BlueprintNodeData;

  // Highlight this node on the canvas
  ctx.onNodeActive(nodeId);
  await wait(ctx.delay);

  switch (data.category) {
    case 'function': {
      // --- Print String: output the value of the 'string-in' pin ---
      if (data.label === 'Print String') {
        const value = resolveInputValue(ctx, nodeId, 'string-in');
        ctx.emit(value || '(empty string)');
      }

      // --- Delay: wait for the specified number of seconds ---
      if (data.label === 'Delay') {
        const duration = parseFloat(resolveInputValue(ctx, nodeId, 'duration')) || 0;
        await wait(duration * 1000);
      }

      // --- HTTP Request: make an API call through the backend proxy ---
      if (data.label === 'HTTP Request') {
        const url = resolveInputValue(ctx, nodeId, 'url');
        const method = resolveInputValue(ctx, nodeId, 'method') || 'GET';
        let paramsObj: Record<string, string> = {};
        try { paramsObj = JSON.parse(resolveInputValue(ctx, nodeId, 'params') || '{}'); } catch { /* ignore */ }

        // Only send a body for methods that support it
        let fetchBody: string | undefined;
        if (method !== 'GET' && method !== 'HEAD') {
          const rawBody = resolveInputValue(ctx, nodeId, 'body');
          if (rawBody) fetchBody = rawBody;
        }

        try {
          ctx.emit(`  → ${method} ${url}`);
          // The request goes to our Vite plugin (server-side), which
          // forwards it to the actual URL, avoiding browser CORS restrictions
          const response = await fetch('/api/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, method, params: paramsObj, body: fetchBody }),
          });
          const result = await response.json() as { status: number; headers: Record<string, string>; body: string; ok: boolean };
          let jsonStr = '';
          try { const parsed = JSON.parse(result.body); jsonStr = JSON.stringify(parsed); } catch { /* not JSON */ }

          // Store the result so downstream nodes can read the outputs
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
            status: 0, headers: '{}', json: '', text: '', ok: false,
          });
          ctx.emit(`  ✗ Request failed: ${err instanceof TypeError ? 'CORS — the server does not allow cross-origin requests from the browser' : err}`);
        }
      }

      // Follow all edges from exec-out (supports fan-out)
      for (const t of followExecAll(ctx, nodeId, 'exec-out')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    case 'branch': {
      // Evaluate the condition: non-empty, non-"false", non-"0" is truthy
      const condition = resolveInputValue(ctx, nodeId, 'condition');
      const isTrue = condition !== '' && condition !== 'false' && condition !== '0';
      // Follow only the chosen branch (true or false), not both
      for (const t of followExecAll(ctx, nodeId, isTrue ? 'true' : 'false')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    case 'loop': {
      if (data.label === 'For Each Loop') {
        // Parse the input array (expected as a JSON array of strings)
        const rawArray = resolveInputValue(ctx, nodeId, 'array');
        let elements: string[] = [];
        try { elements = JSON.parse(rawArray); } catch { /* not a valid array */ }

        for (let i = 0; i < elements.length; i++) {
          ctx.loopIndex.set(nodeId, i);
          ctx.loopValue.set(nodeId, elements[i]);
          // Execute the loop body for this iteration
          // new Set(ancestors) ensures the body can safely visit nodes
          // that were visited in previous iterations
          for (const t of followExecAll(ctx, nodeId, 'body')) {
            if (t.edgeId) ctx.onEdgeActive(t.edgeId);
            await executeNode(ctx, t.targetId, new Set(ancestors), steps);
          }
        }
        ctx.loopIndex.delete(nodeId);
        ctx.loopValue.delete(nodeId);
      } else {
        // For Loop / While Loop: iterate from first-index to last-index
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
      // After all iterations, follow the 'completed' output
      for (const t of followExecAll(ctx, nodeId, 'completed')) {
        if (t.edgeId) ctx.onEdgeActive(t.edgeId);
        await executeNode(ctx, t.targetId, new Set(ancestors), steps);
      }
      break;
    }

    // Start, event, and any unhandled category: just follow exec-out
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

/**
 * Main entry point — called from the Toolbar's "Run" button.
 *
 * Finds all Start nodes in the graph and begins execution from each one.
 * Each Start node initiates its own recursive execution tree.
 */
export async function executeGraph(
  nodes: Node[],
  edges: Edge[],
  onOutput: (msg: string) => void,
  onNodeActive: (nodeId: string) => void,
  onEdgeActive: (edgeId: string) => void,
  stepDelay = 300,
) {
  // Build the execution context with all necessary state
  const ctx: ExecCtx = {
    nodes,
    edges,
    emit: onOutput,
    onNodeActive,
    onEdgeActive,
    delay: stepDelay,
    loopIndex: new Map(),
    loopValue: new Map(),
    requestResults: new Map(),
  };

  // Find all Start nodes — these are the entry points of the graph
  const startNodes = nodes.filter(
    (n) => n.type === 'startNode',
  );

  if (startNodes.length === 0) {
    onOutput('No Start node found on the canvas.');
    return;
  }

  // Execute from each Start node (sequentially)
  for (const startNode of startNodes) {
    const label = (startNode.data as BlueprintNodeData).label;
    onOutput(`▶ Executing from "${label}"`);

    // The steps counter is shared across all branches to enforce a global limit
    const steps = { count: 0 };
    await executeNode(ctx, startNode.id, new Set(), steps);

    if (steps.count >= 1000) {
      onOutput('  ⚠ Max execution steps reached — stopping.');
    }
  }
}
