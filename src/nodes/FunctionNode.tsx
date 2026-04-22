/**
 * Function node component.
 *
 * A thin wrapper around BaseNode. All function-category nodes
 * (Print String, Delay) share the same visual layout — a colored
 * header with an icon and label, plus input/output pin rows.
 * BaseNode handles all of that rendering.
 *
 * In React Flow, every node type needs its own component (even if
 * it just delegates to a shared component) because the type→component
 * mapping is what React Flow uses to render nodes.
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function FunctionNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
