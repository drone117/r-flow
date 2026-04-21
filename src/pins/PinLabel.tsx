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
