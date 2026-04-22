/**
 * Node type registry.
 *
 * React Flow requires a mapping from node type strings (the `type` property
 * on each node) to React components that render them. This file exports that
 * mapping as `nodeTypes`.
 *
 * When React Flow encounters a node with `type: 'functionNode'`, it looks
 * up `nodeTypes['functionNode']` and renders the corresponding component.
 *
 * Most node types (Function, Event, Math, Branch, Loop, Pure) are thin
 * wrappers around `BaseNode`, which provides the shared header/pin rendering.
 * Nodes with unique layouts (Start, Comment, Constant, Array, Conversion,
 * Request) have their own dedicated components.
 */
import { FunctionNode } from './FunctionNode';
import { EventNode } from './EventNode';
import { MathNode } from './MathNode';
import { BranchNode } from './BranchNode';
import { LoopNode } from './LoopNode';
import { CommentNode } from './CommentNode';
import { PureNode } from './PureNode';
import { StartNode } from './StartNode';
import { ConstantNode } from './ConstantNode';
import { ArrayNode } from './ArrayNode';
import { ConversionNode } from './ConversionNode';
import { RequestNode } from './RequestNode';

export const nodeTypes = {
  functionNode: FunctionNode,    // Print String, Delay, HTTP Request (non-request ones)
  eventNode: EventNode,          // Event-triggered nodes (future use)
  mathNode: MathNode,            // Add, Multiply, Clamp
  branchNode: BranchNode,        // Branch (if/else)
  loopNode: LoopNode,            // For Loop, While Loop, For Each Loop
  commentNode: CommentNode,      // Free-text comment boxes
  pureNode: PureNode,            // Format Text and other pure functions
  startNode: StartNode,          // Entry point nodes
  constantNode: ConstantNode,    // Typed constants (String, Float, Int, Bool, JSON)
  arrayNode: ArrayNode,          // Typed arrays (String Array, Float Array, etc.)
  conversionNode: ConversionNode, // Auto-inserted type conversion nodes
  requestNode: RequestNode,      // HTTP Request nodes with custom UI
};
