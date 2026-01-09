/**
 * Login.jsx - Sunbelt PM Login Screen
 *
 * Layout Option 5: Viewport-Scaled
 * - Same vertical layout but everything scales based on viewport
 * - Ring shrinks/grows to always fit without clipping
 * - Uses vh/vw units for responsive scaling
 *
 * @author Claude Code
 * @updated January 9, 2026
 */

import React, { useState, useEffect } from 'react';
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
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const { signIn } = useAuth();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

  // Calculate scale factor based on viewport
  // Target: ring + form should fit in 95% of viewport height
  const baseHeight = 750; // Design baseline height
  const scaleFactor = Math.min(
    (dimensions.height * 0.95) / baseHeight,
    (dimensions.width * 0.95) / 500,
    1.2 // Max scale
  );

  // Scaled values
  const ringRadius = 160 * scaleFactor;
  const logoSize = 48 * scaleFactor;
  const centerLogoSize = 80 * scaleFactor;
  const formWidth = 340 * scaleFactor;

  return (
    <>
      <style>{`
        .login-page {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%);
          overflow: hidden;
          z-index: 9999;
        }

        .login-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: scale(${scaleFactor});
          transform-origin: center center;
        }

        /* Logo assembly - ring + center logo */
        .logo-assembly {
          position: relative;
          width: ${ringRadius * 2 + logoSize}px;
          height: ${ringRadius * 2 + logoSize}px;
          margin-bottom: ${20 * scaleFactor}px;
        }

        .factory-ring {
          position: absolute;
          inset: 0;
          animation: rotateRing 80s linear infinite;
        }

        .factory-ring.animating {
          animation: none;
        }

        .factory-ring.ring-convergence {
          animation: ringAccelerate 1.2s ease-in forwards;
        }

        .factory-ring.ring-launch {
          animation: ringTilt 1s ease-out forwards;
        }

        .factory-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${logoSize}px;
          height: ${logoSize}px;
          border-radius: 50%;
          background: white;
          padding: ${5 * scaleFactor}px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 107, 53, 0.2);
          opacity: 0.85;
          transition: opacity 0.3s ease, box-shadow 0.3s ease;
          animation: counterRotate 80s linear infinite;
        }

        .factory-logo:hover {
          opacity: 1;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.4), 0 0 35px rgba(255, 107, 53, 0.4);
          z-index: 10;
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

        /* Center Sunbelt logo */
        .center-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: ${centerLogoSize}px;
          height: ${centerLogoSize}px;
          border-radius: 50%;
          background: white;
          padding: ${8 * scaleFactor}px;
          box-shadow:
            0 0 30px rgba(255, 107, 53, 0.5),
            0 0 60px rgba(255, 107, 53, 0.3),
            0 6px 20px rgba(0, 0, 0, 0.3);
          animation: pulse 3s ease-in-out infinite;
          z-index: 5;
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

        /* Form section */
        .form-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: ${formWidth}px;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .form-section.form-animating {
          opacity: 0;
          transform: translateY(20px);
        }

        .brand-text {
          text-align: center;
          margin-bottom: ${16 * scaleFactor}px;
        }

        .brand-text h1 {
          font-size: ${1.6 * scaleFactor}rem;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .brand-text p {
          font-size: ${0.7 * scaleFactor}rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin: 0;
        }

        .login-card {
          width: 100%;
          background: rgba(26, 44, 71, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: ${12 * scaleFactor}px;
          padding: ${24 * scaleFactor}px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
        }

        .login-card h2 {
          font-size: ${1.2 * scaleFactor}rem;
          font-weight: 700;
          color: #e8f0f8;
          margin: 0 0 4px 0;
        }

        .login-card .subtitle {
          color: #94a3b8;
          font-size: ${0.8 * scaleFactor}rem;
          margin: 0 0 ${16 * scaleFactor}px 0;
        }

        .form-group {
          margin-bottom: ${14 * scaleFactor}px;
        }

        .form-group label {
          display: block;
          font-size: ${0.7 * scaleFactor}rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: ${5 * scaleFactor}px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          width: 100%;
          padding: ${10 * scaleFactor}px ${12 * scaleFactor}px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: ${8 * scaleFactor}px;
          color: #e8f0f8;
          font-size: ${0.9 * scaleFactor}rem;
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
          padding: ${12 * scaleFactor}px;
          background: linear-gradient(135deg, #FF6B35, #F2A541);
          border: none;
          border-radius: ${8 * scaleFactor}px;
          color: white;
          font-size: ${0.95 * scaleFactor}rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${8 * scaleFactor}px;
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
          border-radius: ${8 * scaleFactor}px;
          padding: ${10 * scaleFactor}px;
          margin-bottom: ${14 * scaleFactor}px;
          display: flex;
          align-items: center;
          gap: ${8 * scaleFactor}px;
          color: #ef4444;
          font-size: ${0.8 * scaleFactor}rem;
        }

        .help-text {
          margin-top: ${16 * scaleFactor}px;
          padding-top: ${16 * scaleFactor}px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: #64748b;
          font-size: ${0.8 * scaleFactor}rem;
        }

        .copyright {
          margin-top: ${12 * scaleFactor}px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: ${0.75 * scaleFactor}rem;
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
            opacity: 0.85;
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

        @keyframes launchStreak {
          0% {
            opacity: 0.85;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1);
            filter: blur(0);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(calc(var(--x) * 4), calc(var(--y) * 4 - 150px)) scale(0.2);
            filter: blur(6px);
          }
        }

        @keyframes sunbeltConverge {
          0% { transform: translate(-50%, -50%) scale(1); }
          60% {
            transform: translate(-50%, -50%) scale(1.5);
            box-shadow: 0 0 80px rgba(255, 107, 53, 1), 0 0 150px rgba(255, 107, 53, 0.7);
          }
          100% {
            transform: translate(-50%, -50%) scale(5);
            opacity: 0;
          }
        }

        @keyframes sunbeltZoom {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(2.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(10); opacity: 0; }
        }

        .loading-spinner {
          width: ${18 * scaleFactor}px;
          height: ${18 * scaleFactor}px;
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

        <div className="login-content">
          {/* Logo Assembly */}
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

            {/* Center Logo */}
            <div className={`center-logo ${animating ? `sunbelt-${animationType}` : ''}`}>
              <img src={SunbeltLogo} alt="Sunbelt Modular" />
            </div>
          </div>

          {/* Form Section */}
          <div className={`form-section ${animating ? 'form-animating' : ''}`}>
            <div className="brand-text">
              <h1>Sunbelt Modular</h1>
              <p>Project Management System</p>
            </div>

            <div className="login-card">
              <h2>Sign In</h2>
              <p className="subtitle">Enter your credentials to access your account</p>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16 * scaleFactor} />
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
                      <LogIn size={18 * scaleFactor} />
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
