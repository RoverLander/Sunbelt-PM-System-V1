// ============================================================================
// WorkerLogin.jsx - PIN-based Worker Login for PWA
// ============================================================================
// Mobile-optimized login screen for factory floor workers.
// Uses employee ID + 4-6 digit PIN authentication.
//
// Created: January 17, 2026
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useWorkerAuth } from '../../contexts/WorkerAuthContext';
import { Factory, Lock, AlertCircle, Loader2, Eye, EyeOff, Clock } from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-xl)',
    boxShadow: 'var(--shadow-lg)'
  },
  header: {
    textAlign: 'center',
    marginBottom: 'var(--space-xl)'
  },
  logo: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto var(--space-md)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 var(--space-xs)'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: 'var(--space-md) var(--space-lg)',
    paddingLeft: '48px',
    fontSize: '1.125rem',
    border: '2px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  },
  inputFocused: {
    borderColor: 'var(--accent-primary)'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none'
  },
  pinToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: 'var(--space-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    width: '100%',
    padding: 'var(--space-md) var(--space-lg)',
    fontSize: '1.125rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    transition: 'opacity 0.15s ease, transform 0.15s ease'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#ef4444',
    fontSize: '0.875rem'
  },
  lockWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#f59e0b',
    fontSize: '0.875rem'
  },
  footer: {
    marginTop: 'var(--space-xl)',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)'
  },
  attemptsWarning: {
    fontSize: '0.75rem',
    color: '#f59e0b',
    marginTop: 'var(--space-xs)'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkerLogin() {
  const { login, loading, error, clearError } = useWorkerAuth();

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Error state
  const [localError, setLocalError] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockMinutes, setLockMinutes] = useState(null);

  // Refs
  const pinInputRef = useRef(null);

  // Clear errors when inputs change
  useEffect(() => {
    if (error) clearError();
    setLocalError(null);
    setAttemptsRemaining(null);
  }, [employeeId, pin]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!employeeId.trim()) {
      setLocalError('Please enter your Employee ID');
      return;
    }

    if (!pin || pin.length < 4) {
      setLocalError('Please enter your 4-6 digit PIN');
      return;
    }

    const result = await login(employeeId.trim(), pin);

    if (!result.success) {
      if (result.locked) {
        setLockedUntil(result.lockedUntil);
        setLockMinutes(result.minutesRemaining);
      } else if (result.attemptsRemaining !== undefined) {
        setAttemptsRemaining(result.attemptsRemaining);
      }
    }
  };

  const handleEmployeeIdKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pinInputRef.current?.focus();
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const displayError = localError || error;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <Factory size={40} color="white" />
          </div>
          <h1 style={styles.title}>Floor App</h1>
          <p style={styles.subtitle}>Sign in to continue</p>
        </div>

        {/* Lock Warning */}
        {isLocked && (
          <div style={styles.lockWarning}>
            <Clock size={20} />
            <div>
              Account locked. Try again in {lockMinutes} minute{lockMinutes !== 1 ? 's' : ''}.
            </div>
          </div>
        )}

        {/* Error Message */}
        {displayError && !isLocked && (
          <div style={styles.error}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              {displayError}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <div style={styles.attemptsWarning}>
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Employee ID */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Employee ID</label>
            <div style={styles.inputWrapper}>
              <Factory size={20} style={styles.inputIcon} />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                onFocus={() => setFocusedInput('employeeId')}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={handleEmployeeIdKeyDown}
                placeholder="Enter your ID (e.g., EMP001)"
                autoComplete="username"
                autoCapitalize="characters"
                disabled={loading || isLocked}
                style={{
                  ...styles.input,
                  ...(focusedInput === 'employeeId' ? styles.inputFocused : {})
                }}
              />
            </div>
          </div>

          {/* PIN */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>PIN</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                ref={pinInputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onFocus={() => setFocusedInput('pin')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Enter 4-6 digit PIN"
                autoComplete="current-password"
                disabled={loading || isLocked}
                style={{
                  ...styles.input,
                  paddingRight: '48px',
                  ...(focusedInput === 'pin' ? styles.inputFocused : {})
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={styles.pinToggle}
                tabIndex={-1}
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isLocked || !employeeId || !pin}
            style={{
              ...styles.button,
              ...(loading || isLocked || !employeeId || !pin ? styles.buttonDisabled : {})
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Contact your supervisor if you need help with your PIN.</p>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
