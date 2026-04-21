import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function MathNode({ data }: NodeProps) {
  return <BaseNode data={data as BlueprintNodeData} />;
}
