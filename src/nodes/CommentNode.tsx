import { type NodeProps, NodeResizer } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { NodeIcon } from '../components/NodeIcon';
import './BaseNode.css';

export function CommentNode({ data, selected }: NodeProps) {
  const { label, commentText } = data as BlueprintNodeData;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={60}
        lineStyle={{ borderColor: 'rgba(200, 168, 50, 0.3)' }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(200, 168, 50, 0.6)',
          border: '1px solid rgba(200, 168, 50, 0.8)',
        }}
      />
      <div
        className="blueprint-node blueprint-node--comment"
        style={{ '--header-color': CATEGORY_COLORS.comment } as React.CSSProperties}
      >
        <div className="blueprint-node__header">
          <span className="blueprint-node__header-icon">
            <NodeIcon category="comment" />
          </span>
          <span className="blueprint-node__header-label">{label}</span>
        </div>
        <div className="blueprint-node__body">
          <textarea
            className="blueprint-node__comment-text"
            defaultValue={commentText ?? ''}
            placeholder="Add a comment..."
            onFocus={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </>
  );
}
