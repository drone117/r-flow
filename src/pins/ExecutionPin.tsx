/**
 * Execution pin component.
 *
 * Renders a white execution pin (the triangular "play" style connector
 * used in Unreal Engine Blueprints). Execution pins control the order
 * of operations — they form the "white wires" that connect nodes in
 * sequence.
 *
 * Unlike data pins, execution pins don't carry typed values. They only
 * have an ID and a direction (source = output, target = input).
 *
 * The CSS class `ue-handle--execution` gives these pins their distinctive
 * white color and triangular shape, differentiating them from colored
 * data pins.
 */
import { Handle, Position } from '@xyflow/react';

interface ExecutionPinProps {
  id: string;
  type: 'source' | 'target';
  position?: Position;
}

export function ExecutionPin({ id, type, position = Position.Left }: ExecutionPinProps) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="ue-handle ue-handle--execution"
      data-datatype="execution"
    />
  );
}
