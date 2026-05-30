import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import useEmailStore from '../store/emailStore';

const icons = {
  success: <CheckCircle size={18} color="#10b981" />,
  error: <XCircle size={18} color="#ef4444" />,
  warning: <AlertTriangle size={18} color="#f59e0b" />,
  info: <Info size={18} color="#3b82f6" />
};

const colors = {
  success: { border: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  error: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  info: { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)' }
};

function Toast({ toast }) {
  const { removeToast } = useEmailStore();
  const c = colors[toast.type] || colors.info;

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        minWidth: 300, maxWidth: 420,
        position: 'relative'
      }}
    >
      {icons[toast.type]}
      <span style={{ fontSize: '0.87rem', color: 'var(--text-primary)', flex: 1 }}>
        {toast.message}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useEmailStore();

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 10,
      zIndex: 9999
    }}>
      {toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
}
