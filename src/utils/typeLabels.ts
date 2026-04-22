/**
 * Shared type label constants.
 *
 * Human-readable labels for pin data types, used by ConstantNode
 * (type badge) and conversionUtils (conversion node labels).
 */

/** Display labels for pin data types. */
export const TYPE_LABELS: Record<string, string> = {
  execution: 'Exec',
  float: 'Float',
  int: 'Int',
  string: 'String',
  bool: 'Bool',
  object: 'Object',
  wildcard: 'Any',
  array: 'Array',
  map: 'Map',
  json: 'JSON',
};
