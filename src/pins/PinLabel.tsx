/**
 * Pin label component.
 *
 * Renders a small text label next to a pin. Labels appear to the left
 * of input pins and to the right of output pins.
 *
 * Example: a pin with `label="Duration"` on the left side shows
 * "Duration" text between the pin circle and the inline value editor.
 *
 * Returns null if the label is empty — this avoids rendering empty
 * spans for execution pins which have no label.
 */
interface PinLabelProps {
  label: string;
  side: 'left' | 'right';
}

export function PinLabel({ label, side }: PinLabelProps) {
  if (!label) return null;
  return (
    <span className={`blueprint-node__pin-label blueprint-node__pin-label--${side}`}>
      {label}
    </span>
  );
}
