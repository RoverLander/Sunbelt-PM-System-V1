// ============================================================================
// WorkerLogin.jsx - PIN-based Worker Login for PWA
// ============================================================================
// Mobile-optimized login screen for factory floor workers.
// Uses employee ID + 4-6 digit PIN authentication.
// Features Sunbelt logo with rotating factory logos ring.
//
// Created: January 17, 2026
// Updated: January 17, 2026 - Added branding and dev bypass
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useWorkerAuth } from '../../contexts/WorkerAuthContext';
import { supabase } from '../../../utils/supabaseClient';
import { Lock, AlertCircle, Loader2, Eye, EyeOff, Clock, User } from 'lucide-react';

// Import logos
import BritcoLogo from '../../../assets/logos/Britco-Logo-Final-FR.png';
import CBLogo from '../../../assets/logos/C-B-Logo-Final-1-400x400.png';
import IndicomLogo from '../../../assets/logos/Indicom-Logo-Final-400x400.png';
import MrSteelLogo from '../../../assets/logos/Mr-Steel-Logo-Final.png';
import AmTexLogo from '../../../assets/logos/New-AmTex-Logo.png';
import NorthwestLogo from '../../../assets/logos/Northwest-Logo-Final.png';
import PMILogo from '../../../assets/logos/PMI-Revision-400x309.png';
import SSILogo from '../../../assets/logos/SSI-Logo-Tall.png';
import SoutheastLogo from '../../../assets/logos/Southeast-Logo-Final.png';
import ProModLogo from '../../../assets/logos/proMOD-NEW-400x349.jpg';
import ProBoxLogo from '../../../assets/logos/probox-NEW-400x349.jpg';
import WhitleyLogo from '../../../assets/logos/logo.png';
import SunbeltLogo from '../../../assets/logos/Sunbelt-Logo.jpg';

// Factory data
const FACTORIES = [
  { id: 'amt', name: 'AMTEX', logo: AmTexLogo },
  { id: 'busa', name: 'Britco USA', logo: BritcoLogo },
  { id: 'cb', name: 'C&B Modular', logo: CBLogo },
  { id: 'ibi', name: 'Indicom Buildings', logo: IndicomLogo },
  { id: 'mrs', name: 'MR Steel', logo: MrSteelLogo },
  { id: 'nwbs', name: 'Northwest Building', logo: NorthwestLogo },
  { id: 'pmi', name: 'Phoenix Modular', logo: PMILogo },
  { id: 'prm', name: 'Pro-Mod', logo: ProModLogo },
  { id: 'smm', name: 'Southeast Modular', logo: SoutheastLogo },
  { id: 'ssi', name: 'Specialized Structures', logo: SSILogo },
  { id: 'pbx', name: 'ProBox', logo: ProBoxLogo },
  { id: 'wm', name: 'Whitley Manufacturing', logo: WhitleyLogo },
];

// Dev bypass - set to true to skip authentication for testing
const DEV_BYPASS = import.meta.env.DEV;

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
    if (error) clearError?.();
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

    // Dev bypass for testing - uses real NWBS factory
    if (DEV_BYPASS && employeeId.toUpperCase() === 'TEST' && pin === '1234') {
      try {
        // Fetch the NWBS factory from database
        const { data: factory } = await supabase
          .from('factories')
          .select('id, name, code')
          .eq('code', 'NWBS')
          .single();

        const factoryId = factory?.id || null;

        // Simulate a successful login for testing
        const mockWorker = {
          id: 'test-worker-id',
          employee_id: 'TEST',
          name: 'Test Worker',
          first_name: 'Test',
          last_name: 'Worker',
          title: 'Lead Tester',
          is_lead: true,
          factory_id: factoryId,
          factory_code: factory?.code || 'NWBS',
          factory_name: factory?.name || 'Northwest Building Systems'
        };

        // Store in localStorage to simulate session
        localStorage.setItem('worker_session_token', 'dev-bypass-token');
        localStorage.setItem('worker_session_data', JSON.stringify(mockWorker));
        localStorage.setItem('worker_session_expires', new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString());

        // Reload to pick up the session
        window.location.reload();
        return;
      } catch (err) {
        console.error('Dev bypass error:', err);
        setLocalError('Dev bypass failed - could not fetch factory');
        return;
      }
    }

    console.log('[WorkerLogin] Attempting login for:', employeeId.trim());
    const result = await login(employeeId.trim(), pin);
    console.log('[WorkerLogin] Login result:', result);

    if (!result.success) {
      if (result.locked) {
        setLockedUntil(result.lockedUntil);
        setLockMinutes(result.minutesRemaining);
      } else if (result.attemptsRemaining !== undefined) {
        setAttemptsRemaining(result.attemptsRemaining);
      }
      // Set local error - use result.error or fallback
      setLocalError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleEmployeeIdKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pinInputRef.current?.focus();
    }
  };

  // Calculate logo position in ring
  const getLogoPosition = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const displayError = localError || error;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  return (
    <>
      <style>{`
        .pwa-login-page {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%);
          overflow: hidden;
          z-index: 9999;
        }

        .pwa-login-container {
          position: relative;
          width: min(95vw, 420px);
          height: min(95vh, 650px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Rotating ring of factory logos */
        .pwa-factory-ring {
          position: absolute;
          inset: 0;
          animation: pwaRotateRing 80s linear infinite;
        }

        .pwa-factory-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          padding: 4px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 107, 53, 0.2);
          opacity: 0.75;
          animation: pwaCounterRotate 80s linear infinite;
        }

        .pwa-factory-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* Center content */
        .pwa-center-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 320px;
          padding: 0 16px;
        }

        /* Sunbelt logo */
        .pwa-sunbelt-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: white;
          padding: 6px;
          margin-bottom: 12px;
          box-shadow:
            0 0 30px rgba(255, 107, 53, 0.5),
            0 0 60px rgba(255, 107, 53, 0.3),
            0 6px 20px rgba(0, 0, 0, 0.3);
          animation: pwaPulse 3s ease-in-out infinite;
        }

        .pwa-sunbelt-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* Brand text */
        .pwa-brand-text {
          text-align: center;
          margin-bottom: 16px;
        }

        .pwa-brand-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .pwa-brand-text p {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0;
        }

        /* Login card */
        .pwa-login-card {
          width: 100%;
          background: rgba(26, 44, 71, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
        }

        .pwa-login-card h2 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #e8f0f8;
          margin: 0 0 4px 0;
          text-align: center;
        }

        .pwa-login-card .pwa-subtitle {
          color: #94a3b8;
          font-size: 0.75rem;
          margin: 0 0 16px 0;
          text-align: center;
        }

        .pwa-form-group {
          margin-bottom: 14px;
        }

        .pwa-form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pwa-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pwa-form-group input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #e8f0f8;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .pwa-form-group input:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }

        .pwa-form-group input::placeholder {
          color: #64748b;
        }

        .pwa-input-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
          pointer-events: none;
        }

        .pwa-pin-toggle {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwa-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #FF6B35, #F2A541);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          margin-top: 6px;
        }

        .pwa-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
        }

        .pwa-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pwa-error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #fca5a5;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .pwa-error-message svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pwa-lock-warning {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.5);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fcd34d;
          font-size: 0.85rem;
        }

        .pwa-attempts-warning {
          font-size: 0.75rem;
          color: #fcd34d;
          margin-top: 6px;
        }

        .pwa-help-text {
          margin-top: 16px;
          text-align: center;
          color: #64748b;
          font-size: 0.75rem;
        }

        .pwa-dev-hint {
          margin-top: 12px;
          padding: 10px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          text-align: center;
          color: #86efac;
          font-size: 0.7rem;
        }

        .pwa-copyright {
          margin-top: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.7rem;
        }

        /* Animations */
        @keyframes pwaRotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pwaCounterRotate {
          from { transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(0deg); }
          to { transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(-360deg); }
        }

        @keyframes pwaPulse {
          0%, 100% {
            box-shadow:
              0 0 30px rgba(255, 107, 53, 0.5),
              0 0 60px rgba(255, 107, 53, 0.3),
              0 6px 20px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 45px rgba(255, 107, 53, 0.7),
              0 0 90px rgba(255, 107, 53, 0.4),
              0 6px 20px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes pwaSpin {
          to { transform: rotate(360deg); }
        }

        .pwa-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: pwaSpin 0.8s linear infinite;
        }
      `}</style>

      <div className="pwa-login-page">
        <div className="pwa-login-container">
          {/* Rotating Ring of Factory Logos */}
          <div className="pwa-factory-ring">
            {FACTORIES.map((factory, index) => {
              const ringRadius = Math.min(window.innerWidth * 0.38, window.innerHeight * 0.35, 200);
              const { x, y } = getLogoPosition(index, FACTORIES.length, ringRadius);
              return (
                <div
                  key={factory.id}
                  className="pwa-factory-logo"
                  style={{
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                  }}
                >
                  <img src={factory.logo} alt={factory.name} />
                </div>
              );
            })}
          </div>

          {/* Center Content */}
          <div className="pwa-center-content">
            {/* Sunbelt Logo */}
            <div className="pwa-sunbelt-logo">
              <img src={SunbeltLogo} alt="Sunbelt Modular" />
            </div>

            {/* Brand Text */}
            <div className="pwa-brand-text">
              <h1>Sunbelt Modular</h1>
              <p>Floor App</p>
            </div>

            {/* Login Card */}
            <div className="pwa-login-card">
              <h2>Worker Sign In</h2>
              <p className="pwa-subtitle">Enter your Employee ID and PIN</p>

              {/* Lock Warning */}
              {isLocked && (
                <div className="pwa-lock-warning">
                  <Clock size={20} />
                  <div>
                    Account locked. Try again in {lockMinutes} minute{lockMinutes !== 1 ? 's' : ''}.
                  </div>
                </div>
              )}

              {/* Error Message */}
              {displayError && !isLocked && (
                <div className="pwa-error-message">
                  <AlertCircle size={18} />
                  <div>
                    {displayError}
                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <div className="pwa-attempts-warning">
                        {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Employee ID */}
                <div className="pwa-form-group">
                  <label>Employee ID</label>
                  <div className="pwa-input-wrapper">
                    <User size={18} className="pwa-input-icon" />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      onFocus={() => setFocusedInput('employeeId')}
                      onBlur={() => setFocusedInput(null)}
                      onKeyDown={handleEmployeeIdKeyDown}
                      placeholder="e.g., EMP001"
                      autoComplete="username"
                      autoCapitalize="characters"
                      disabled={loading || isLocked}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div className="pwa-form-group">
                  <label>PIN</label>
                  <div className="pwa-input-wrapper">
                    <Lock size={18} className="pwa-input-icon" />
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
                      placeholder="4-6 digit PIN"
                      autoComplete="current-password"
                      disabled={loading || isLocked}
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="pwa-pin-toggle"
                      tabIndex={-1}
                    >
                      {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || isLocked || !employeeId || !pin}
                  className="pwa-submit-btn"
                >
                  {loading ? (
                    <>
                      <div className="pwa-spinner" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="pwa-help-text">
                Contact your supervisor if you need help with your PIN.
              </p>

              {/* Dev bypass hint */}
              {DEV_BYPASS && (
                <div className="pwa-dev-hint">
                  <strong>Dev Mode:</strong> Use TEST / 1234 to bypass auth
                </div>
              )}
            </div>

            <p className="pwa-copyright">&copy; 2026 Sunbelt Modular</p>
          </div>
        </div>
      </div>
    </>
  );
}
