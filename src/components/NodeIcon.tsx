interface NodeIconProps {
  category: string;
}

export function NodeIcon({ category }: NodeIconProps) {
  const size = 14;

  switch (category) {
    case 'function':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M2 12L6 4H10L14 12H10L8 7.5L6 12H2Z" fill="rgba(255,255,255,0.85)" />
        </svg>
      );
    case 'event':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M8 1L9.5 6H14.5L10.5 9L12 14L8 11L4 14L5.5 9L1.5 6H6.5L8 1Z" fill="rgba(255,255,255,0.85)" />
        </svg>
      );
    case 'variable':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,0.85)" />
        </svg>
      );
    case 'math':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M4 8H12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <path d="M8 4V12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
        </svg>
      );
    case 'branch':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14 12H2L8 2Z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'loop':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M12 8A4 4 0 1 1 8 4"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M8 1L8 5L12 4" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'pure':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M3 12L6 4H10L13 12" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'start':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M4 2L13 8L4 14V2Z" fill="rgba(255,255,255,0.9)" />
        </svg>
      );
    default:
      return null;
  }
}
