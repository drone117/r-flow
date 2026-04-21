import { FunctionNode } from './FunctionNode';
import { EventNode } from './EventNode';
import { VariableNode } from './VariableNode';
import { MathNode } from './MathNode';
import { BranchNode } from './BranchNode';
import { LoopNode } from './LoopNode';
import { CommentNode } from './CommentNode';
import { PureNode } from './PureNode';
import { StartNode } from './StartNode';
import { ConstantNode } from './ConstantNode';
import { ArrayNode } from './ArrayNode';
import { MapNode } from './MapNode';
import { ConversionNode } from './ConversionNode';

export const nodeTypes = {
  functionNode: FunctionNode,
  eventNode: EventNode,
  variableNode: VariableNode,
  mathNode: MathNode,
  branchNode: BranchNode,
  loopNode: LoopNode,
  commentNode: CommentNode,
  pureNode: PureNode,
  startNode: StartNode,
  constantNode: ConstantNode,
  arrayNode: ArrayNode,
  mapNode: MapNode,
  conversionNode: ConversionNode,
};
