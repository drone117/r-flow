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
};
