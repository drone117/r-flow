/**
 * Event node component.
 *
 * Currently delegates entirely to BaseNode, same as FunctionNode.
 * Event nodes are reserved for future use — they would represent
 * triggers like "On Click", "On Timer", etc.
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function EventNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
