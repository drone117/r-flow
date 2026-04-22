/**
 * Shared node hooks.
 *
 * Custom hooks used by multiple node components to avoid duplicating
 * common patterns like value updates and connected pin lookups.
 */

import { useStore, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';

/**
 * Returns a callback that updates a value in a node's `data.values` map.
 * Used by BaseNode, ConstantNode, and RequestNode for inline editors.
 */
export function useNodeValueUpdater(nodeId: string) {
  const { setNodes } = useReactFlow();

  return (pinId: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
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
}

/**
 * Returns the set of input pin IDs that have an incoming edge connected.
 * Used to hide inline editors when a pin is wired (value comes from upstream).
 */
export function useConnectedInputIds(nodeId: string) {
  return useStore((s) => {
    const ids = new Set<string>();
    for (const e of s.edges) {
      if (e.target === nodeId) ids.add(e.targetHandle!);
    }
    return ids;
  });
}

/** Auto-resize a textarea to fit its content. */
export function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
