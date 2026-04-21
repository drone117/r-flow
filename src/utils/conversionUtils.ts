import type { PinDataType } from '../types';

const CONVERTIBLE_TYPES: Set<PinDataType> = new Set(['float', 'int', 'string', 'bool']);

export function isConvertible(from: PinDataType, to: PinDataType): boolean {
  if (from === to) return false;
  if (from === 'wildcard' || to === 'wildcard') return false;
  if (from === 'execution' || to === 'execution') return false;
  if (from === 'object' || to === 'object') return false;
  return CONVERTIBLE_TYPES.has(from) && CONVERTIBLE_TYPES.has(to);
}

export function convertValue(value: string, from: PinDataType, to: PinDataType): string {
  if (from === to) return value;

  switch (to) {
    case 'string':
      return value;
    case 'int': {
      if (from === 'bool') return value === 'true' ? '1' : '0';
      return String(parseInt(value, 10) || 0);
    }
    case 'float': {
      if (from === 'bool') return value === 'true' ? '1' : '0';
      if (from === 'int') return value;
      return String(parseFloat(value) || 0);
    }
    case 'bool': {
      if (from === 'int' || from === 'float') return parseFloat(value) !== 0 ? 'true' : 'false';
      return value !== '' && value !== 'false' && value !== '0' ? 'true' : 'false';
    }
    default:
      return value;
  }
}

const TYPE_LABELS: Record<string, string> = {
  float: 'Float',
  int: 'Int',
  string: 'String',
  bool: 'Bool',
};

export function getConversionLabel(from: PinDataType, to: PinDataType): string {
  const toLabel = TYPE_LABELS[to] ?? to;
  const fromLabel = TYPE_LABELS[from] ?? from;
  if (from === to) return toLabel;
  return `${fromLabel} → ${toLabel}`;
}
