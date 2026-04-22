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
  functionNode: FunctionNode,
  eventNode: EventNode,
  mathNode: MathNode,
  branchNode: BranchNode,
  loopNode: LoopNode,
  commentNode: CommentNode,
  pureNode: PureNode,
  startNode: StartNode,
  constantNode: ConstantNode,
  arrayNode: ArrayNode,
  conversionNode: ConversionNode,
  requestNode: RequestNode,
};
