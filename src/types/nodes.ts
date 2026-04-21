export type NodeCategory =
  | 'function'
  | 'event'
  | 'variable'
  | 'math'
  | 'branch'
  | 'loop'
  | 'comment'
  | 'pure'
  | 'start';

export type PinDataType =
  | 'execution'
  | 'float'
  | 'int'
  | 'string'
  | 'bool'
  | 'object'
  | 'wildcard';

export type PinDirection = 'target' | 'source';

export interface PinConfig {
  id: string;
  label: string;
  direction: PinDirection;
  dataType: PinDataType;
}

export interface BlueprintNodeData {
  label: string;
  category: NodeCategory;
  icon?: string;
  inputs?: PinConfig[];
  outputs?: PinConfig[];
  commentText?: string;
  values?: Record<string, string>;
  [key: string]: unknown;
}

export const PIN_COLORS: Record<PinDataType, string> = {
  execution: '#ffffff',
  float: '#e8d44d',
  int: '#1bc6a0',
  string: '#f050a0',
  bool: '#cc0000',
  object: '#0066ff',
  wildcard: '#aaaaaa',
};

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  function: '#2d5baa',
  event: '#8b1a1a',
  variable: '#1a6b3c',
  math: '#1a6b6b',
  branch: '#555566',
  loop: '#555566',
  comment: 'rgba(200, 168, 50, 0.3)',
  pure: '#3d3d5c',
  start: '#1a8b3c',
};
