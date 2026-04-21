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
    case 'array':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <path d="M5 6H11M5 8H11M5 10H11" stroke="rgba(255,255,255,0.85)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'map':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <path d="M5 6H7M9 6H11M5 10H7M9 10H11" stroke="rgba(255,255,255,0.85)" strokeWidth="1" strokeLinecap="round" />
          <path d="M8 5V7M8 9V11" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'constant':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
          <path d="M6 6H10M6 8.5H10" stroke="rgba(255,255,255,0.85)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case 'comment':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V10C14 10.5523 13.5523 11 13 11H5L2 14V3Z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'flowcontrol':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M3 3H6V7H10V3H13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 7V13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 13H10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'utilities':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M6 2L10 2L10 6L14 6L14 10L10 10L10 14L6 14L6 10L2 10L2 6L6 6Z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'conversion':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M3 5H7M9 11H13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 5L5 3M7 5L5 7M9 11L7 9M9 11L7 13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
