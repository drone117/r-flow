/**
 * Math node component.
 *
 * Delegates to BaseNode. Math nodes (Add, Multiply, Clamp) use wildcard
 * pins that accept any numeric type. The execution engine handles type
 * detection at runtime by checking the connected edge's dataType.
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function MathNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
