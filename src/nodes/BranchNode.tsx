/**
 * Branch node component.
 *
 * Delegates to BaseNode. Branch nodes have two execution outputs
 * ("True" and "False") and a boolean "Condition" input. The executor
 * evaluates the condition and follows only the matching branch.
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function BranchNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
