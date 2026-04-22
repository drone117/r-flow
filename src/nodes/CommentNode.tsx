/**
 * Comment node component.
 *
 * Free-text annotation boxes placed on the canvas. They don't participate
 * in execution — they're purely visual documentation.
 *
 * Key features:
 *   - Auto-resizing textarea that grows as the user types
 *   - Horizontal resize handle on the right edge (drag to change width)
 *   - Enter (without Shift) blurs the textarea instead of adding a newline
 *   - Comment text is NOT stored in `values` — it uses `commentText` on
 *     the node data directly (no persistent state sync needed; the
 *     textarea manages its own content via `defaultValue`)
 *
 * The resize handle works by:
 *   1. onMouseDown → record starting X position and current width
 *   2. window mousemove → calculate delta, clamp to [160, 800], update node style
 *   3. window mouseup → stop tracking
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { type NodeProps, useReactFlow } from '@xyflow/react';
import type { BlueprintNodeData } from '../types';
import { CATEGORY_COLORS } from '../types';
import { NodeIcon } from '../components/NodeIcon';
import { autoResizeTextarea } from '../hooks/useNodeHelpers';
import './BaseNode.css';

export function CommentNode({ id, data }: NodeProps) {
  const { label, commentText } = data as BlueprintNodeData;
  const { setNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Auto-resize on mount
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, []);

  // Begin horizontal resize drag
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

  // Track mouse movement during resize, update node width in the store
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
          onInput={(e) => autoResizeTextarea(e.currentTarget)}
          onKeyDown={(e) => {
            // Enter without Shift blurs the textarea (single-line mode)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          onFocus={(e) => e.stopPropagation()}
        />
      </div>
      {/* Drag handle on the right edge for horizontal resizing */}
      <div className="blueprint-node__resize-handle nodrag" onMouseDown={onResizeStart} />
    </div>
  );
}
