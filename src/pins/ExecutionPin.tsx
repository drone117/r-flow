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
