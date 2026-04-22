/**
 * Type barrel file.
 *
 * Re-exports all types and constants from the type definition files.
 * Other modules import from './types' (this file) instead of from
 * the individual files directly.
 *
 * This is the single import source for:
 *   - Type definitions: NodeCategory, PinDataType, PinDirection, PinConfig,
 *     BlueprintNodeData, BlueprintEdgeData
 *   - Constants: PIN_COLORS (pin type → color mapping),
 *     CATEGORY_COLORS (node category → header color mapping)
 */
export type {
  NodeCategory,
  PinDataType,
  PinDirection,
  PinConfig,
  BlueprintNodeData,
} from './nodes';

export { PIN_COLORS, CATEGORY_COLORS } from './nodes';

export type { BlueprintEdgeData } from './edges';
