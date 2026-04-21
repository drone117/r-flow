import { Handle, Position } from '@xyflow/react';

interface DataPinProps {
  id: string;
  type: 'source' | 'target';
  dataType: string;
  position?: Position;
  color?: string;
}

export function DataPin({ id, type, dataType, position = Position.Left, color }: DataPinProps) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="ue-handle ue-handle--data"
      data-datatype={dataType}
      style={color ? { '--pin-bg': color } as React.CSSProperties : undefined}
    />
  );
}
