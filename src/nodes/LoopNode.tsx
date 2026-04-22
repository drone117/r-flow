/**
 * Loop node component.
 *
 * Delegates to BaseNode. Loop nodes (For Loop, While Loop, For Each Loop)
 * have execution pins for "Loop Body" and "Completed", plus data outputs
 * for "Index" and optionally "Value" (For Each only).
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function LoopNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
