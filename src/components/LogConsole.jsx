import React, { useEffect, useRef } from 'react';
import { formatTime } from '../utils/helpers';

export default function LogConsole({ logs = [], maxHeight = 340 }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  if (!logs.length) {
    return (
      <div className="log-console" style={{ maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
          // No logs yet. Start a campaign to see activity here.
        </span>
      </div>
    );
  }

  return (
    <div className="log-console" style={{ maxHeight }}>
      {[...logs].reverse().map((log, i) => (
        <div key={log.id || i} className="log-entry fade-in">
          <span className="log-time">[{formatTime(log.timestamp)}]</span>
          <span className="log-email">{log.recipientEmail}</span>
          <span className={`log-${log.status}`}>{log.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
