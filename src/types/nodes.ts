/**
 * Node type definitions for the blueprint editor.
 *
 * Each node in the blueprint graph has a "data" object conforming to BlueprintNodeData.
 * Nodes are connected via pins (inputs/outputs). Pins carry typed data between nodes.
 *
 * There are two kinds of pins:
 *   - Execution pins (white) — control the flow of execution, like wires in a circuit.
 *     Only one execution pin can be connected to another; they define the order in
 *     which nodes run.
 *   - Data pins (colored by type) — carry values (numbers, strings, booleans, etc.)
 *     between nodes. A data pin can have at most one incoming connection.
 */

/** Which category a node belongs to. Used for header coloring and icon selection. */
export type NodeCategory =
  | 'function'    // Nodes that perform an action (Print String, Delay, HTTP Request)
  | 'event'       // Entry-point nodes triggered by external events
  | 'variable'    // Nodes that read/write variables (currently unused)
  | 'math'        // Nodes that perform arithmetic (Add, Multiply, Clamp)
  | 'branch'      // Nodes that split execution into two paths (Branch)
  | 'loop'        // Nodes that repeat execution (For Loop, While Loop, For Each Loop)
  | 'comment'     // Non-executable annotation nodes
  | 'pure'        // Pure data nodes with no execution pins (Constants, Format Text)
  | 'start'       // The entry point of a blueprint graph
  | 'conversion'; // Auto-inserted nodes that convert between data types

/**
 * The data type of a pin. Determines the color of the pin and which pins
 * can connect to each other.
 *
 * - 'wildcard' pins accept any data type. Their color is resolved at render
 *   time from whatever is connected to them.
 * - 'execution' pins are special — they don't carry data, they carry control flow.
 */
export type PinDataType =
  | 'execution'  // Control flow (always white)
  | 'float'      // Decimal number (yellow)
  | 'int'        // Integer number (teal)
  | 'string'     // Text (pink)
  | 'bool'       // Boolean true/false (red)
  | 'object'     // Generic object (blue)
  | 'wildcard'   // Accepts any type (gray, resolves color from connection)
  | 'json';      // JSON string (green)

/** Whether a pin is an input (left side) or output (right side) of the node. */
export type PinDirection = 'target' | 'source';

/**
 * Definition of a single pin on a node.
 * Each node declares its pins as arrays of PinConfig in its data.inputs and data.outputs.
 */
export interface PinConfig {
  id: string;          // Unique identifier within the node (e.g., 'exec-in', 'string-in')
  label: string;       // Display name shown next to the pin (e.g., 'In String', 'A', 'B')
  direction: PinDirection;
  dataType: PinDataType;
}

/**
 * The data object stored on every node in the graph.
 * This is the shape of the `data` property on React Flow's Node type.
 */
export interface BlueprintNodeData {
  label: string;         // Node title shown in the header (e.g., 'Print String')
  category: NodeCategory; // Determines the header color and icon
  icon?: string;          // Optional icon override
  inputs?: PinConfig[];   // Input pins (left side)
  outputs?: PinConfig[];  // Output pins (right side)
  commentText?: string;   // Only used by comment nodes
  values?: Record<string, string>; // User-entered values for each input pin (keyed by pin id)
  [key: string]: unknown; // Allow extra properties for specialized nodes
}

/**
 * Pin colors used throughout the editor. Each PinDataType maps to a hex color.
 * Used for rendering pin dots, edge lines, and type badges.
 */
export const PIN_COLORS: Record<PinDataType, string> = {
  execution: '#ffffff',
  float:     '#e8d44d',
  int:       '#1bc6a0',
  string:    '#f050a0',
  bool:      '#cc0000',
  object:    '#0066ff',
  wildcard:  '#aaaaaa',
  json:      '#50c878',
};

/**
 * Header colors for each node category.
 * Applied via a CSS custom property (--header-color) on the node's header div.
 */
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  function:   '#2d5baa',
  event:      '#8b1a1a',
  variable:   '#1a6b3c',
  math:       '#1a6b6b',
  branch:     '#555566',
  loop:       '#555566',
  comment:    'rgba(200, 168, 50, 0.3)',
  pure:       '#3d3d5c',
  start:      '#1a8b3c',
  conversion: '#2a4a6b',
};
