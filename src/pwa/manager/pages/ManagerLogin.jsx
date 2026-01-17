// ============================================================================
// ManagerLogin.jsx - Manager Login Page for PWA
// ============================================================================
// Mobile-optimized login page using email/password via Supabase Auth.
// Features the Sunbelt logo with rotating factory logos ring.
// Only allows management roles (PM, PC, VP, Director, Admin).
//
// Created: January 17, 2026
// Updated: January 17, 2026 - Added revolving factory logos
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader, LogIn } from 'lucide-react';

// Import all factory logos
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

// Factory data with logos
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

// ============================================================================
// COMPONENT
// ============================================================================

export default function ManagerLogin() {
  const { login, loading, error, clearError } = useManagerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [ringRadius, setRingRadius] = useState(100);

  // Calculate ring radius based on viewport
  useEffect(() => {
    const updateRadius = () => {
      // Smaller radius for mobile - fits above the form
      const vw = window.innerWidth;
      const radius = Math.min(vw * 0.28, 110);
      setRingRadius(radius);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    // Start animation
    setAnimating(true);

    const result = await login(email.trim(), password);

    if (!result.success) {
      setAnimating(false);
      setLocalError(result.error);
    }
    // If success, auth context will redirect - keep animating
  };

  const displayError = localError || error;

  // Calculate position for each factory logo in the ring
  const getLogoPosition = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <style>{`
        .manager-login-page {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%);
          overflow: hidden;
          z-index: 9999;
        }

        /* Logo section - top portion */
        .logo-section {
          position: relative;
          width: 100%;
          height: 260px;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Rotating ring of factory logos */
        .factory-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          animation: rotateRing 60s linear infinite;
        }

        .factory-ring.ring-animating {
          animation: ringAccelerate 1.5s ease-in forwards;
        }

        .factory-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(255, 107, 53, 0.15);
          opacity: 0.9;
          transition: opacity 0.3s ease;
          animation: counterRotate 60s linear infinite;
        }

        .factory-logo.logo-animating {
          animation: convergeSpiral 1.5s ease-in forwards;
        }

        .factory-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* Center Sunbelt logo */
        .sunbelt-logo {
          position: relative;
          z-index: 5;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: white;
          padding: 6px;
          box-shadow:
            0 0 20px rgba(255, 107, 53, 0.4),
            0 0 40px rgba(255, 107, 53, 0.2),
            0 4px 15px rgba(0, 0, 0, 0.3);
          animation: pulse 3s ease-in-out infinite;
        }

        .sunbelt-logo.sunbelt-animating {
          animation: sunbeltConverge 1.5s ease-in-out forwards;
        }

        .sunbelt-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* Brand text below logo */
        .brand-text {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 10;
          background: rgba(10, 22, 40, 0.85);
          padding: 10px 20px;
          border-radius: 12px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .brand-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
        }

        .brand-text p {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 4px 0 0 0;
        }

        /* Form section - bottom card */
        .form-section {
          flex: 1;
          background: var(--bg-primary, #ffffff);
          border-radius: 28px 28px 0 0;
          padding: 28px 24px env(safe-area-inset-bottom, 20px);
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.2);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .form-section.form-animating {
          opacity: 0.5;
          transform: translateY(20px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .form-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
          margin: 0 0 20px 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary, #9ca3af);
          pointer-events: none;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          font-size: 1rem;
          border: 1.5px solid var(--border-primary, #e5e7eb);
          border-radius: 12px;
          background: var(--bg-secondary, #f9fafb);
          color: var(--text-primary, #1f2937);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }

        .form-input::placeholder {
          color: var(--text-tertiary, #9ca3af);
        }

        .password-toggle {
          position: absolute;
          right: 8px;
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--text-tertiary, #9ca3af);
          cursor: pointer;
          z-index: 1;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 10px;
          margin-bottom: 18px;
        }

        .error-box svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .error-text {
          font-size: 0.875rem;
          color: #dc2626;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%;
          padding: 14px 20px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #FF6B35 0%, #F2A541 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          margin-top: 24px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.45);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .footer-text {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-primary, #e5e7eb);
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-tertiary, #9ca3af);
          line-height: 1.5;
        }

        .copyright {
          margin-top: 16px;
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-tertiary, #9ca3af);
        }

        /* Animation overlay for successful login */
        .animation-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
          transition-delay: 0.8s;
          z-index: 10000;
          background: radial-gradient(circle at center, rgba(255,107,53,0.9) 0%, rgba(255,255,255,1) 70%);
        }

        .animation-overlay.active {
          opacity: 1;
          pointer-events: all;
        }

        /* Keyframe animations */
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes counterRotate {
          from { transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(0deg); }
          to { transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(-360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(255, 107, 53, 0.4),
              0 0 40px rgba(255, 107, 53, 0.2),
              0 4px 15px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 30px rgba(255, 107, 53, 0.6),
              0 0 60px rgba(255, 107, 53, 0.3),
              0 4px 15px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes ringAccelerate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1080deg); }
        }

        @keyframes convergeSpiral {
          0% {
            opacity: 0.9;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 0.3), calc(var(--y) * 0.3)) scale(0.7) rotate(540deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0px, 0px) scale(0) rotate(1080deg);
          }
        }

        @keyframes sunbeltConverge {
          0% { transform: scale(1); }
          60% {
            transform: scale(1.4);
            box-shadow: 0 0 50px rgba(255, 107, 53, 0.9), 0 0 100px rgba(255, 107, 53, 0.6);
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive adjustments */
        @media (max-height: 650px) {
          .logo-section {
            height: 200px;
            min-height: 180px;
          }
          .sunbelt-logo {
            width: 60px;
            height: 60px;
          }
          .factory-logo {
            width: 30px;
            height: 30px;
          }
          .brand-text h1 {
            font-size: 1.1rem;
          }
          .form-section {
            padding: 20px 20px env(safe-area-inset-bottom, 16px);
          }
        }

        @media (min-width: 480px) {
          .form-section {
            max-width: 420px;
            margin: 0 auto;
            border-radius: 28px 28px 0 0;
          }
        }
      `}</style>

      <div className="manager-login-page">
        {/* Animation Overlay */}
        <div className={`animation-overlay ${animating ? 'active' : ''}`} />

        {/* Logo Section with Rotating Ring */}
        <div className="logo-section">
          {/* Rotating Ring of Factory Logos */}
          <div className={`factory-ring ${animating ? 'ring-animating' : ''}`}>
            {FACTORIES.map((factory, index) => {
              const { x, y } = getLogoPosition(index, FACTORIES.length, ringRadius);
              return (
                <div
                  key={factory.id}
                  className={`factory-logo ${animating ? 'logo-animating' : ''}`}
                  style={{
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    animationDelay: animating ? `${index * 0.04}s` : '0s',
                  }}
                >
                  <img src={factory.logo} alt={factory.name} loading="eager" />
                </div>
              );
            })}
          </div>

          {/* Center Sunbelt Logo */}
          <div className={`sunbelt-logo ${animating ? 'sunbelt-animating' : ''}`}>
            <img src={SunbeltLogo} alt="Sunbelt Modular" />
          </div>

          {/* Brand Text */}
          <div className="brand-text">
            <h1>Sunbelt Modular</h1>
            <p>Manager Mobile</p>
          </div>
        </div>

        {/* Form Section */}
        <div className={`form-section ${animating ? 'form-animating' : ''}`}>
          <h2 className="form-title">Sign In</h2>

          <form onSubmit={handleSubmit}>
            {/* Error Display */}
            {displayError && (
              <div className="error-box">
                <AlertCircle size={18} color="#dc2626" />
                <span className="error-text">{displayError}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@sunbeltmodular.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="form-input"
                  style={{ paddingRight: '48px' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="footer-text">
            For project managers, coordinators, and directors.
            <br />
            Need access? Contact your administrator.
          </p>

          <p className="copyright">
            &copy; 2026 Sunbelt Modular. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
