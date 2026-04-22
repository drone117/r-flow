/**
 * Edge (connection) data definitions.
 *
 * Edges connect output pins to input pins. Each edge stores the resolved
 * data type and pin color, so the edge line can be rendered in the correct color.
 */
export interface BlueprintEdgeData {
  dataType: string;   // The resolved PinDataType of this connection (e.g., 'float', 'string')
  pinColor: string;   // The hex color to use for the edge line
  [key: string]: unknown;
}
