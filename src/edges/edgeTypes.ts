/**
 * Edge type registry.
 *
 * React Flow requires a mapping from edge type strings to React components.
 * All edges in this project use the 'blueprint' type, which renders as
 * a custom BlueprintEdge with bezier curves, glow effects, and optional
 * animated flow during execution.
 */
import { BlueprintEdge } from './BlueprintEdge';

export const edgeTypes = {
  blueprint: BlueprintEdge,
};
