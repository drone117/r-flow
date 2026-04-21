import { useRef, useEffect, useState, useCallback } from 'react';
import { type NodeProps, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { NodeIcon } from '../components/NodeIcon';
import './BaseNode.css';

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export function CommentNode({ id, data }: NodeProps) {
  const { label, commentText } = data as BlueprintNodeData;
  const { setNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, []);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = (e.currentTarget.parentElement as HTMLElement)?.offsetWidth ?? 200;
    },
    [],
  );

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(160, Math.min(800, startWidthRef.current + delta));
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          return { ...n, style: { ...n.style, width: newWidth } };
        }),
      );
    };

    const onMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, id, setNodes]);

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
          className="blueprint-node__comment-text nodrag"
          defaultValue={commentText ?? ''}
          placeholder="Add a comment..."
          rows={1}
          onInput={(e) => autoResize(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          onFocus={(e) => e.stopPropagation()}
        />
      </div>
      <div className="blueprint-node__resize-handle nodrag" onMouseDown={onResizeStart} />
    </div>
  );
}
