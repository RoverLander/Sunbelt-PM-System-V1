/**
 * Login.jsx - Sunbelt PM Login Screen
 *
 * Layout Option 4: Ring as Background
 * - Large ring fills most of the screen (subtle/faded)
 * - Form card centered with Sunbelt logo above it
 * - Factory logos orbit behind/around the form
 *
 * @author Claude Code
 * @updated January 9, 2026
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

// Import all factory logos
import BritcoLogo from '../../assets/logos/Britco-Logo-Final-FR.png';
import CBLogo from '../../assets/logos/C-B-Logo-Final-1-400x400.png';
import IndicomLogo from '../../assets/logos/Indicom-Logo-Final-400x400.png';
import MrSteelLogo from '../../assets/logos/Mr-Steel-Logo-Final.png';
import AmTexLogo from '../../assets/logos/New-AmTex-Logo.png';
import NorthwestLogo from '../../assets/logos/Northwest-Logo-Final.png';
import PMILogo from '../../assets/logos/PMI-Revision-400x309.png';
import SSILogo from '../../assets/logos/SSI-Logo-Tall.png';
import SoutheastLogo from '../../assets/logos/Southeast-Logo-Final.png';
import ProModLogo from '../../assets/logos/proMOD-NEW-400x349.jpg';
import ProBoxLogo from '../../assets/logos/probox-NEW-400x349.jpg';
import WhitleyLogo from '../../assets/logos/logo.png';
import SunbeltLogo from '../../assets/logos/Sunbelt Logo.jpg';

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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const animation = Math.random() > 0.5 ? 'convergence' : 'launch';
      setAnimationType(animation);
      setAnimating(true);

      const authPromise = signIn(email, password);

      await Promise.all([
        authPromise,
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

    } catch (error) {
      setAnimating(false);
      setAnimationType(null);
      setError(error.message);
      setLoading(false);
    }
  };

  // Calculate position for each factory logo in the ring
  const getLogoPosition = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // Large radius that fills the viewport
  const ringRadius = Math.min(
    typeof window !== 'undefined' ? window.innerWidth * 0.42 : 350,
    typeof window !== 'undefined' ? window.innerHeight * 0.42 : 350
  );

  return (
    <>
      <style>{`
        .login-page {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%);
          overflow: hidden;
          z-index: 9999;
        }

        /* Large background ring */
        .background-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          animation: rotateRing 90s linear infinite;
          opacity: 0.6;
        }

        .background-ring.animating {
          animation: none;
        }

        .background-ring.ring-convergence {
          animation: ringAccelerate 1.2s ease-in forwards;
        }

        .background-ring.ring-launch {
          animation: ringTilt 1s ease-out forwards;
        }

        .factory-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          padding: 6px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 107, 53, 0.15);
          opacity: 0.7;
          transition: opacity 0.3s ease, transform 0.3s ease;
          animation: counterRotate 90s linear infinite;
        }

        .factory-logo:hover {
          opacity: 1;
          transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1.2) !important;
          z-index: 100;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 107, 53, 0.4);
        }

        .factory-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .factory-logo.logo-convergence {
          animation: convergeSpiral 1.2s ease-in forwards;
        }

        .factory-logo.logo-launch {
          animation: launchStreak 1.2s ease-out forwards;
        }

        /* Center form card */
        .center-form {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 360px;
          max-width: 90vw;
        }

        .center-form.form-animating {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* Sunbelt logo */
        .sunbelt-logo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: white;
          padding: 10px;
          margin-bottom: 20px;
          box-shadow:
            0 0 40px rgba(255, 107, 53, 0.6),
            0 0 80px rgba(255, 107, 53, 0.4),
            0 8px 30px rgba(0, 0, 0, 0.4);
          animation: pulse 3s ease-in-out infinite;
        }

        .sunbelt-logo.sunbelt-convergence {
          animation: sunbeltConverge 1.2s ease-in-out forwards;
        }

        .sunbelt-logo.sunbelt-launch {
          animation: sunbeltZoom 1.2s ease-in forwards;
        }

        .sunbelt-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        /* Brand text */
        .brand-text {
          text-align: center;
          margin-bottom: 20px;
        }

        .brand-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin: 0 0 6px 0;
          text-shadow: 0 2px 15px rgba(0, 0, 0, 0.4);
        }

        .brand-text p {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0;
        }

        /* Login card */
        .login-card {
          width: 100%;
          background: rgba(26, 44, 71, 0.97);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .login-card h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8f0f8;
          margin: 0 0 6px 0;
        }

        .login-card .subtitle {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #e8f0f8;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.2);
        }

        .form-group input::placeholder {
          color: #64748b;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #FF6B35, #F2A541);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(255, 107, 53, 0.6);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-size: 0.85rem;
        }

        .help-text {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
        }

        .copyright {
          margin-top: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
        }

        /* Animation overlay */
        .animation-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
          transition-delay: 0.7s;
          z-index: 1000;
        }

        .animation-overlay.active {
          opacity: 1;
          pointer-events: all;
        }

        .animation-overlay.convergence {
          background: radial-gradient(circle at center, rgba(255,107,53,0.9) 0%, rgba(255,255,255,1) 70%);
        }

        .animation-overlay.launch {
          background: linear-gradient(to top, transparent 0%, rgba(255,255,255,1) 100%);
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
              0 0 40px rgba(255, 107, 53, 0.6),
              0 0 80px rgba(255, 107, 53, 0.4),
              0 8px 30px rgba(0, 0, 0, 0.4);
          }
          50% {
            box-shadow:
              0 0 60px rgba(255, 107, 53, 0.8),
              0 0 120px rgba(255, 107, 53, 0.5),
              0 8px 30px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes ringAccelerate {
          0% { transform: rotate(0deg); opacity: 0.6; }
          100% { transform: rotate(1080deg); opacity: 1; }
        }

        @keyframes ringTilt {
          0% { transform: rotate(0deg) perspective(1000px) rotateX(0deg); opacity: 0.6; }
          100% { transform: rotate(360deg) perspective(1000px) rotateX(75deg); opacity: 1; }
        }

        @keyframes convergeSpiral {
          0% {
            opacity: 0.7;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 0.3), calc(var(--y) * 0.3)) scale(0.6) rotate(540deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0px, 0px) scale(0) rotate(1080deg);
          }
        }

        @keyframes launchStreak {
          0% {
            opacity: 0.7;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1);
            filter: blur(0);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.85);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 3.5), calc(var(--y) * 3.5 - 200px)) scale(0.15);
            filter: blur(8px);
          }
        }

        @keyframes sunbeltConverge {
          0% { transform: scale(1); }
          60% {
            transform: scale(1.6);
            box-shadow: 0 0 100px rgba(255, 107, 53, 1), 0 0 180px rgba(255, 107, 53, 0.8);
          }
          100% {
            transform: scale(6);
            opacity: 0;
          }
        }

        @keyframes sunbeltZoom {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(3); opacity: 1; }
          100% { transform: scale(12); opacity: 0; }
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
      `}</style>

      <div className="login-page">
        {/* Animation Overlay */}
        <div className={`animation-overlay ${animating ? 'active' : ''} ${animationType || ''}`} />

        {/* Large Background Ring */}
        <div className={`background-ring ${animating ? `animating ring-${animationType}` : ''}`}>
          {FACTORIES.map((factory, index) => {
            const { x, y } = getLogoPosition(index, FACTORIES.length, ringRadius);
            return (
              <div
                key={factory.id}
                className={`factory-logo ${animating ? `logo-${animationType}` : ''}`}
                style={{
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  '--x': `${x}px`,
                  '--y': `${y}px`,
                  animationDelay: animating ? `${index * 0.04}s` : '0s',
                }}
              >
                <img src={factory.logo} alt={factory.name} />
              </div>
            );
          })}
        </div>

        {/* Center Form */}
        <div className={`center-form ${animating ? 'form-animating' : ''}`}>
          {/* Sunbelt Logo */}
          <div className={`sunbelt-logo ${animating ? `sunbelt-${animationType}` : ''}`}>
            <img src={SunbeltLogo} alt="Sunbelt Modular" />
          </div>

          {/* Brand Text */}
          <div className="brand-text">
            <h1>Sunbelt Modular</h1>
            <p>Project Management System</p>
          </div>

          {/* Login Card */}
          <div className="login-card">
            <h2>Sign In</h2>
            <p className="subtitle">Enter your credentials to access your account</p>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@sunbeltmodular.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
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

            <p className="help-text">Need access? Contact your system administrator</p>
          </div>

          <p className="copyright">&copy; 2026 Sunbelt Modular. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}

export default Login;
