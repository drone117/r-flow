/**
 * Data pin component.
 *
 * Renders a single data pin (colored circle) on a node. Data pins carry
 * typed values between nodes — the color indicates the data type:
 *   - Yellow = float, Teal = int, Pink = string, Red = bool, etc.
 *
 * This wraps React Flow's `<Handle>` component with:
 *   - A CSS class (`ue-handle--data`) for the pin styling
 *   - A `data-datatype` attribute (used by CSS for per-type styling)
 *   - An optional `--pin-bg` CSS custom property for dynamic color
 *     (used when wildcard pins need to display a resolved color)
 *
 * Props:
 *   - id: Unique handle ID within the node (must match the pin definition)
 *   - type: 'source' (output, right side) or 'target' (input, left side)
 *   - dataType: The PinDataType (float, int, string, bool, wildcard, etc.)
 *   - position: Left or Right (determines which side of the node)
 *   - color: Optional override color for wildcard pins (resolved at runtime)
 */
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
