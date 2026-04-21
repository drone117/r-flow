import { useEffect, useRef } from 'react';
import { Panel } from '@xyflow/react';
import { useOutputStore } from '../store/outputStore';
import './OutputConsole.css';

export function OutputConsole() {
  const messages = useOutputStore((s) => s.messages);
  const clearMessages = useOutputStore((s) => s.clearMessages);
  const bodyRef = useRef<HTMLDivElement>(null);

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
