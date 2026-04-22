/**
 * Pure node component.
 *
 * Delegates to BaseNode. Pure nodes are functions with no execution pins —
 * they compute an output value purely from their inputs. Currently used
 * for Format Text ("Hello {0}!" + arg → "Hello World!").
 */
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { BlueprintNodeData } from '../types';

export function PureNode({ id, data }: NodeProps) {
  return <BaseNode id={id} data={data as BlueprintNodeData} />;
}
