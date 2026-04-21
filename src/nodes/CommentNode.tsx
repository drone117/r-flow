import { useRef, useEffect, type NodeProps } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { NodeIcon } from '../components/NodeIcon';
import './BaseNode.css';

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export function CommentNode({ data }: NodeProps) {
  const { label, commentText } = data as BlueprintNodeData;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, []);

  return (
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
          ref={textareaRef}
          className="blueprint-node__comment-text"
          defaultValue={commentText ?? ''}
          placeholder="Add a comment..."
          rows={1}
          onInput={(e) => autoResize(e.currentTarget)}
          onFocus={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
