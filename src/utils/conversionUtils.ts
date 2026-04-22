/**
 * Type conversion utilities.
 *
 * When a user connects two pins of different but compatible data types
 * (e.g., float output → string input), the system auto-inserts a
 * ConversionNode. These functions determine which conversions are
 * allowed and perform the actual value transformation.
 */

import type { PinDataType } from '../types';
import { TYPE_LABELS } from './typeLabels';

/** The set of types that can be converted between each other. */
const CONVERTIBLE_TYPES: Set<PinDataType> = new Set(['float', 'int', 'string', 'bool', 'json']);

/**
 * Check if a value of type `from` can be converted to type `to`.
 *
 * Rules:
 *   - Same type → not convertible (no conversion needed)
 *   - Wildcard → not convertible (wildcard accepts anything directly)
 *   - Execution → not convertible (execution pins only connect to execution)
 *   - Object → not convertible (opaque type)
 *   - JSON → only convertible to string
 *   - Everything else (float, int, string, bool) → convertible to each other
 */
export function isConvertible(from: PinDataType, to: PinDataType): boolean {
  if (from === to) return false;
  if (from === 'wildcard' || to === 'wildcard') return false;
  if (from === 'execution' || to === 'execution') return false;
  if (from === 'object' || to === 'object') return false;
  if (from === 'json' && to !== 'string') return false;
  if (to === 'json') return false;
  return CONVERTIBLE_TYPES.has(from) && CONVERTIBLE_TYPES.has(to);
}

/**
 * Convert a string value from one data type to another.
 * The conversion is lossy in some cases (e.g., float → int drops decimals).
 */
export function convertValue(value: string, from: PinDataType, to: PinDataType): string {
  if (from === to) return value;

  switch (to) {
    case 'string':
      return value; // Everything has a natural string representation
    case 'int': {
      if (from === 'bool') return value === 'true' ? '1' : '0';
      return String(parseInt(value, 10) || 0);
    }
    case 'float': {
      if (from === 'bool') return value === 'true' ? '1' : '0';
      if (from === 'int') return value; // int is already a valid float
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

/** Human-readable label for a conversion, e.g., "Float → String". */
export function getConversionLabel(from: PinDataType, to: PinDataType): string {
  const toLabel = TYPE_LABELS[to] ?? to;
  const fromLabel = TYPE_LABELS[from] ?? from;
  if (from === to) return toLabel;
  return `${fromLabel} → ${toLabel}`;
}
