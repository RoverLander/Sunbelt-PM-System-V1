import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--success)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-lg)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      zIndex: 9999,
      minWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--success-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <CheckCircle size={24} color="var(--success)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '2px'
        }}>
          Success!
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          borderRadius: '4px',
          transition: 'all 0.15s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'none';
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default Toast;