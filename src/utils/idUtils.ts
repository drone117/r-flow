/**
 * Shared ID generation utilities.
 *
 * Used by node factory and canvas clipboard to generate unique IDs
 * for nodes and edges.
 */

/** Generate a unique node ID using timestamp + random suffix. */
export function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Generate a unique edge ID using timestamp + random suffix. */
export function generateEdgeId(): string {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
