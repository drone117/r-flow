import type { Node, XYPosition } from '@xyflow/react';
import type { PinConfig } from '../types';

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface NodeTemplate {
  type: string;
  data: {
    label: string;
    category: string;
    icon?: string;
    inputs?: PinConfig[];
    outputs?: PinConfig[];
    commentText?: string;
    [key: string]: unknown;
  };
}

const templates: Record<string, NodeTemplate> = {
  start: {
    type: 'startNode',
    data: {
      label: 'Start',
      category: 'start',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  eventBeginPlay: {
    type: 'eventNode',
    data: {
      label: 'Event BeginPlay',
      category: 'event',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  eventTick: {
    type: 'eventNode',
    data: {
      label: 'Event Tick',
      category: 'event',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
        { id: 'delta-seconds', label: 'Delta Seconds', direction: 'source', dataType: 'float' },
      ],
    },
  },
  customEvent: {
    type: 'eventNode',
    data: {
      label: 'Custom Event',
      category: 'event',
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  printString: {
    type: 'functionNode',
    data: {
      label: 'Print String',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'string-in', label: 'In String', direction: 'target', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  delay: {
    type: 'functionNode',
    data: {
      label: 'Delay',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'duration', label: 'Duration', direction: 'target', dataType: 'float' },
      ],
      outputs: [
        { id: 'exec-out', label: 'Completed', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  setTimer: {
    type: 'functionNode',
    data: {
      label: 'Set Timer by Event',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'time', label: 'Time', direction: 'target', dataType: 'float' },
        { id: 'looping', label: 'Looping', direction: 'target', dataType: 'bool' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
        { id: 'return-value', label: 'Return Value', direction: 'source', dataType: 'object' },
      ],
    },
  },
  getVariable: {
    type: 'variableNode',
    data: {
      label: 'Get Variable',
      category: 'variable',
      outputs: [
        { id: 'value-out', label: 'Value', direction: 'source', dataType: 'wildcard' },
      ],
    },
  },
  setVariable: {
    type: 'variableNode',
    data: {
      label: 'Set Variable',
      category: 'variable',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'value-in', label: 'Value', direction: 'target', dataType: 'wildcard' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
        { id: 'value-out', label: 'Value', direction: 'source', dataType: 'wildcard' },
      ],
    },
  },
  mathAdd: {
    type: 'mathNode',
    data: {
      label: 'Float + Float',
      category: 'math',
      inputs: [
        { id: 'a', label: 'A', direction: 'target', dataType: 'float' },
        { id: 'b', label: 'B', direction: 'target', dataType: 'float' },
      ],
      outputs: [
        { id: 'result', label: 'Result', direction: 'source', dataType: 'float' },
      ],
    },
  },
  mathMultiply: {
    type: 'mathNode',
    data: {
      label: 'Float * Float',
      category: 'math',
      inputs: [
        { id: 'a', label: 'A', direction: 'target', dataType: 'float' },
        { id: 'b', label: 'B', direction: 'target', dataType: 'float' },
      ],
      outputs: [
        { id: 'result', label: 'Result', direction: 'source', dataType: 'float' },
      ],
    },
  },
  mathClamp: {
    type: 'mathNode',
    data: {
      label: 'Clamp',
      category: 'math',
      inputs: [
        { id: 'value', label: 'Value', direction: 'target', dataType: 'float' },
        { id: 'min', label: 'Min', direction: 'target', dataType: 'float' },
      ],
      outputs: [
        { id: 'result', label: 'Result', direction: 'source', dataType: 'float' },
      ],
    },
  },
  branch: {
    type: 'branchNode',
    data: {
      label: 'Branch',
      category: 'branch',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'condition', label: 'Condition', direction: 'target', dataType: 'bool' },
      ],
      outputs: [
        { id: 'true', label: 'True', direction: 'source', dataType: 'execution' },
        { id: 'false', label: 'False', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  forLoop: {
    type: 'loopNode',
    data: {
      label: 'For Loop',
      category: 'loop',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'first-index', label: 'First Index', direction: 'target', dataType: 'int' },
        { id: 'last-index', label: 'Last Index', direction: 'target', dataType: 'int' },
      ],
      outputs: [
        { id: 'body', label: 'Loop Body', direction: 'source', dataType: 'execution' },
        { id: 'completed', label: 'Completed', direction: 'source', dataType: 'execution' },
        { id: 'index', label: 'Index', direction: 'source', dataType: 'int' },
      ],
    },
  },
  whileLoop: {
    type: 'loopNode',
    data: {
      label: 'While Loop',
      category: 'loop',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'condition', label: 'Condition', direction: 'target', dataType: 'bool' },
      ],
      outputs: [
        { id: 'body', label: 'Loop Body', direction: 'source', dataType: 'execution' },
        { id: 'completed', label: 'Completed', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  forEachLoop: {
    type: 'loopNode',
    data: {
      label: 'For Each Loop',
      category: 'loop',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'array', label: 'Array', direction: 'target', dataType: 'wildcard' },
      ],
      outputs: [
        { id: 'body', label: 'Loop Body', direction: 'source', dataType: 'execution' },
        { id: 'completed', label: 'Completed', direction: 'source', dataType: 'execution' },
        { id: 'index', label: 'Index', direction: 'source', dataType: 'int' },
        { id: 'value', label: 'Value', direction: 'source', dataType: 'wildcard' },
      ],
    },
  },
  comment: {
    type: 'commentNode',
    data: {
      label: 'Comment',
      category: 'comment',
      commentText: 'Add a comment...',
    },
  },
  formatText: {
    type: 'pureNode',
    data: {
      label: 'Format Text',
      category: 'pure',
      inputs: [
        { id: 'format', label: 'Format', direction: 'target', dataType: 'string' },
        { id: 'arg1', label: 'Arg 1', direction: 'target', dataType: 'string' },
      ],
      outputs: [
        { id: 'result', label: 'Result', direction: 'source', dataType: 'string' },
      ],
    },
  },
  constString: {
    type: 'constantNode',
    data: {
      label: 'String',
      category: 'pure',
      dataType: 'string',
      outputs: [
        { id: 'value-out', label: '', direction: 'source', dataType: 'string' },
      ],
      values: { value: '' },
    },
  },
  constFloat: {
    type: 'constantNode',
    data: {
      label: 'Float',
      category: 'pure',
      dataType: 'float',
      outputs: [
        { id: 'value-out', label: '', direction: 'source', dataType: 'float' },
      ],
      values: { value: '0.0' },
    },
  },
  constInt: {
    type: 'constantNode',
    data: {
      label: 'Int',
      category: 'pure',
      dataType: 'int',
      outputs: [
        { id: 'value-out', label: '', direction: 'source', dataType: 'int' },
      ],
      values: { value: '0' },
    },
  },
  constBool: {
    type: 'constantNode',
    data: {
      label: 'Bool',
      category: 'pure',
      dataType: 'bool',
      outputs: [
        { id: 'value-out', label: '', direction: 'source', dataType: 'bool' },
      ],
      values: { value: 'false' },
    },
  },
  constJson: {
    type: 'constantNode',
    data: {
      label: 'JSON',
      category: 'pure',
      dataType: 'json',
      outputs: [
        { id: 'value-out', label: '', direction: 'source', dataType: 'json' },
      ],
      values: { value: '{}' },
    },
  },
  arrayString: {
    type: 'arrayNode',
    data: {
      label: 'String Array',
      category: 'pure',
      elementType: 'string',
      outputs: [
        { id: 'array-out', label: '', direction: 'source', dataType: 'string' },
      ],
      items: [{ id: 'item-0', value: '' }],
    },
  },
  arrayFloat: {
    type: 'arrayNode',
    data: {
      label: 'Float Array',
      category: 'pure',
      elementType: 'float',
      outputs: [
        { id: 'array-out', label: '', direction: 'source', dataType: 'float' },
      ],
      items: [{ id: 'item-0', value: '0.0' }],
    },
  },
  arrayInt: {
    type: 'arrayNode',
    data: {
      label: 'Int Array',
      category: 'pure',
      elementType: 'int',
      outputs: [
        { id: 'array-out', label: '', direction: 'source', dataType: 'int' },
      ],
      items: [{ id: 'item-0', value: '0' }],
    },
  },
  arrayBool: {
    type: 'arrayNode',
    data: {
      label: 'Bool Array',
      category: 'pure',
      elementType: 'bool',
      outputs: [
        { id: 'array-out', label: '', direction: 'source', dataType: 'bool' },
      ],
      items: [{ id: 'item-0', value: 'false' }],
    },
  },
  mapStringString: {
    type: 'mapNode',
    data: {
      label: 'Map (String → String)',
      category: 'pure',
      keyType: 'string',
      valueType: 'string',
      entries: [{ id: 'entry-0', key: '', value: '' }],
    },
  },
  mapStringInt: {
    type: 'mapNode',
    data: {
      label: 'Map (String → Int)',
      category: 'pure',
      keyType: 'string',
      valueType: 'int',
      entries: [{ id: 'entry-0', key: '', value: '0' }],
    },
  },
  mapStringFloat: {
    type: 'mapNode',
    data: {
      label: 'Map (String → Float)',
      category: 'pure',
      keyType: 'string',
      valueType: 'float',
      entries: [{ id: 'entry-0', key: '', value: '0.0' }],
    },
  },
};

export function createNodeFromType(type: string, position: XYPosition): Node {
  const template = templates[type];
  if (!template) {
    return {
      id: generateId(),
      type: 'pureNode',
      position,
      data: { label: type, category: 'pure', inputs: [], outputs: [] },
    };
  }
  return {
    id: generateId(),
    type: template.type,
    position,
    data: { ...template.data },
  };
}

export interface SidebarNodeEntry {
  type: string;
  label: string;
  category: string;
}

export interface SidebarCategory {
  name: string;
  items: SidebarNodeEntry[];
}

export const sidebarCategories: SidebarCategory[] = [
  {
    name: 'Events',
    items: [
      { type: 'start', label: 'Start', category: 'start' },
    ],
  },
  {
    name: 'Functions',
    items: [
      { type: 'printString', label: 'Print String', category: 'function' },
    ],
  },
  {
    name: 'Variables',
    items: [
      { type: 'getVariable', label: 'Get Variable', category: 'variable' },
      { type: 'setVariable', label: 'Set Variable', category: 'variable' },
    ],
  },
  {
    name: 'Constants',
    items: [
      { type: 'constString', label: 'String', category: 'pure' },
      { type: 'constFloat', label: 'Float', category: 'pure' },
      { type: 'constInt', label: 'Int', category: 'pure' },
      { type: 'constBool', label: 'Bool', category: 'pure' },
      { type: 'constJson', label: 'JSON', category: 'pure' },
    ],
  },
  {
    name: 'Arrays',
    items: [
      { type: 'arrayString', label: 'String Array', category: 'pure' },
      { type: 'arrayFloat', label: 'Float Array', category: 'pure' },
      { type: 'arrayInt', label: 'Int Array', category: 'pure' },
      { type: 'arrayBool', label: 'Bool Array', category: 'pure' },
    ],
  },
  {
    name: 'Maps',
    items: [
      { type: 'mapStringString', label: 'Map (String → String)', category: 'pure' },
      { type: 'mapStringInt', label: 'Map (String → Int)', category: 'pure' },
      { type: 'mapStringFloat', label: 'Map (String → Float)', category: 'pure' },
    ],
  },
  {
    name: 'Math',
    items: [
      { type: 'mathAdd', label: 'Float + Float', category: 'math' },
      { type: 'mathMultiply', label: 'Float * Float', category: 'math' },
      { type: 'mathClamp', label: 'Clamp', category: 'math' },
    ],
  },
  {
    name: 'Flow Control',
    items: [
      { type: 'branch', label: 'Branch', category: 'branch' },
      { type: 'forLoop', label: 'For Loop', category: 'loop' },
      { type: 'forEachLoop', label: 'For Each Loop', category: 'loop' },
      { type: 'whileLoop', label: 'While Loop', category: 'loop' },
    ],
  },
  {
    name: 'Utilities',
    items: [
      { type: 'comment', label: 'Comment', category: 'comment' },
      { type: 'formatText', label: 'Format Text', category: 'pure' },
    ],
  },
];
