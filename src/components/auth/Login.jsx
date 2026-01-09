/**
 * Login.jsx - Sunbelt PM Login Screen
 *
 * Features:
 * - Centered login form with Sunbelt branding
 * - Animated factory logo ring rotating around center logo
 * - Two random login animations: Convergence and Launch
 * - Smooth transitions to dashboard
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
      // Choose random animation
      const animation = Math.random() > 0.5 ? 'convergence' : 'launch';
      setAnimationType(animation);
      setAnimating(true);

      // Start authentication in parallel with animation
      const authPromise = signIn(email, password);

      // Wait for animation to complete before showing dashboard
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

  // Ring radius - responsive
  const ringRadius = 180;
  const logoSize = 55;
  const centerLogoSize = 120;

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%);
          padding: 20px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .login-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 500px;
        }

        .logo-assembly {
          position: relative;
          width: ${ringRadius * 2 + logoSize}px;
          height: ${ringRadius * 2 + logoSize}px;
          margin-bottom: 30px;
          flex-shrink: 0;
        }

        .factory-ring {
          position: absolute;
          inset: 0;
          animation: rotateRing 40s linear infinite;
        }

        .factory-ring.animating {
          animation: none;
        }

        .factory-ring.ring-convergence {
          animation: ringAccelerate 1s ease-in forwards;
        }

        .factory-ring.ring-launch {
          animation: ringTilt 0.8s ease-out forwards;
        }

        .factory-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${logoSize}px;
          height: ${logoSize}px;
          border-radius: 50%;
          background: white;
          padding: 6px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 107, 53, 0.15);
          opacity: 0.8;
          transition: opacity 0.3s ease, box-shadow 0.3s ease;
          animation: counterRotate 40s linear infinite;
        }

        .factory-logo:hover {
          opacity: 1;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 107, 53, 0.3);
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

        .center-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: ${centerLogoSize}px;
          height: ${centerLogoSize}px;
          border-radius: 50%;
          background: white;
          padding: 8px;
          box-shadow:
            0 0 30px rgba(255, 107, 53, 0.5),
            0 0 60px rgba(255, 107, 53, 0.3),
            0 8px 25px rgba(0, 0, 0, 0.3);
          animation: pulse 3s ease-in-out infinite;
          z-index: 10;
        }

        .center-logo.sunbelt-convergence {
          animation: sunbeltConverge 1.2s ease-in-out forwards;
        }

        .center-logo.sunbelt-launch {
          animation: sunbeltZoom 1.2s ease-in forwards;
        }

        .center-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .login-form-container {
          width: 100%;
          max-width: 380px;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .login-form-container.form-animating {
          opacity: 0;
          transform: translateY(30px);
        }

        .brand-text {
          text-align: center;
          margin-bottom: 24px;
        }

        .brand-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
        }

        .brand-text p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0;
        }

        .login-card {
          background: rgba(26, 44, 71, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
        }

        .login-card h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #e8f0f8;
          margin: 0 0 6px 0;
        }

        .login-card .subtitle {
          color: #94a3b8;
          font-size: 0.875rem;
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e8f0f8;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
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
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
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
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
        }

        .copyright {
          margin-top: 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
        }

        .animation-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
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

        /* Animations */
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
              0 0 30px rgba(255, 107, 53, 0.5),
              0 0 60px rgba(255, 107, 53, 0.3),
              0 8px 25px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 50px rgba(255, 107, 53, 0.7),
              0 0 100px rgba(255, 107, 53, 0.4),
              0 8px 25px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes ringAccelerate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1080deg); }
        }

        @keyframes ringTilt {
          0% { transform: rotate(0deg) perspective(800px) rotateX(0deg); }
          100% { transform: rotate(360deg) perspective(800px) rotateX(70deg); }
        }

        @keyframes convergeSpiral {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 0.4), calc(var(--y) * 0.4)) scale(0.8) rotate(540deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0px, 0px) scale(0) rotate(1080deg);
          }
        }

        @keyframes launchStreak {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1);
            filter: blur(0);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 5), calc(var(--y) * 5 - 200px)) scale(0.2);
            filter: blur(6px);
          }
        }

        @keyframes sunbeltConverge {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          60% {
            transform: translate(-50%, -50%) scale(1.5);
            box-shadow: 0 0 80px rgba(255, 107, 53, 1), 0 0 150px rgba(255, 107, 53, 0.7);
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }

        @keyframes sunbeltZoom {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(8);
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

        /* Responsive */
        @media (max-height: 800px) {
          .logo-assembly {
            width: ${ringRadius * 1.6 + logoSize * 0.8}px;
            height: ${ringRadius * 1.6 + logoSize * 0.8}px;
            margin-bottom: 20px;
          }
        }

        @media (max-width: 500px) {
          .logo-assembly {
            width: 300px;
            height: 300px;
          }
          .login-card {
            padding: 20px;
          }
        }
      `}</style>

      <div className="login-page">
        {/* Animation Overlay */}
        <div className={`animation-overlay ${animating ? 'active' : ''} ${animationType || ''}`} />

        <div className="login-content">
          {/* Logo Assembly - Ring + Center Logo */}
          <div className="logo-assembly">
            {/* Rotating Ring */}
            <div className={`factory-ring ${animating ? `animating ring-${animationType}` : ''}`}>
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

            {/* Center Sunbelt Logo */}
            <div className={`center-logo ${animating ? `sunbelt-${animationType}` : ''}`}>
              <img src={SunbeltLogo} alt="Sunbelt Modular" />
            </div>
          </div>

          {/* Login Form */}
          <div className={`login-form-container ${animating ? 'form-animating' : ''}`}>
            <div className="brand-text">
              <h1>Sunbelt Modular</h1>
              <p>Project Management System</p>
            </div>

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
      </div>
    </>
  );
}

export default Login;
