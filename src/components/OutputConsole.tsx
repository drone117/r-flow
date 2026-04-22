/**
 * Output console component.
 *
 * A floating panel (positioned bottom-right via React Flow's <Panel>)
 * that displays messages emitted during graph execution. Messages are
 * stored in `outputStore` and rendered here in order.
 *
 * Message styling:
 *   - System messages (starting with ▶ or ⚠) get a muted style
 *   - Empty string indicators "(empty string)" get a dimmed style
 *   - Regular output gets the default style
 *
 * Auto-scroll: the panel automatically scrolls to the bottom when
 * new messages are added (via a useEffect on the messages array).
 *
 * The "Clear" button calls `outputStore.clearMessages()` to wipe
 * all messages. The executor calls `clearMessages()` before each run.
 */
import { useEffect, useRef } from 'react';
import { Panel } from '@xyflow/react';
import { useOutputStore } from '../store/outputStore';
import './OutputConsole.css';

export function OutputConsole() {
  const messages = useOutputStore((s) => s.messages);
  const clearMessages = useOutputStore((s) => s.clearMessages);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Panel position="bottom-right">
      <div className="output-console">
        <div className="output-console__header">
          <span className="output-console__title">Output Log</span>
          <button className="output-console__clear" onClick={clearMessages}>
            Clear
          </button>
        </div>
        <div className="output-console__body" ref={bodyRef}>
          {messages.length === 0 ? (
            <div className="output-console__empty">Output will appear here after running...</div>
          ) : (
            messages.map((msg, i) => {
              // Apply different styles based on message content
              let cls = 'output-console__line ';
              if (msg.startsWith('▶') || msg.startsWith('⚠')) {
                cls += 'output-console__line--system';
              } else if (msg === '(empty string)') {
                cls += 'output-console__line--empty';
              } else {
                cls += 'output-console__line--output';
              }
              return (
                <div key={i} className={cls}>
                  {msg}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
}
