/**
 * Login.jsx - Sunbelt PM Login Screen
 *
 * Features:
 * - Centered login form with Sunbelt branding
 * - Animated factory logo ring rotating around center logo
 * - Two random login animations: Convergence and Launch
 * - Smooth transitions to dashboard
 *
 * Animation Details:
 * - Idle: Ring rotates slowly clockwise (~40s per revolution)
 * - Convergence: Logos spiral inward and merge at center
 * - Launch: Logos streak outward, Sunbelt zooms toward camera
 *
 * @author Claude Code
 * @updated January 9, 2026
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [animationType, setAnimationType] = useState(null); // 'convergence' or 'launch'
  const { signIn } = useAuth();
  const containerRef = useRef(null);

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

      // Wait for animation to complete (1.2s) before showing dashboard
      await Promise.all([
        authPromise,
        new Promise(resolve => setTimeout(resolve, 1200))
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
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle };
  };

  return (
    <div
      ref={containerRef}
      className={`login-container ${animating ? `animating-${animationType}` : ''}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2c47 50%, #0f172a 100%)',
        padding: 'var(--space-xl)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Animated background particles */}
      <div className="login-particles" style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: animating ? 0 : 0.3,
        transition: 'opacity 0.5s ease',
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: 'var(--sunbelt-orange)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo Ring Container */}
      <div
        className={`logo-ring-container ${animating ? 'animating' : ''}`}
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Rotating Ring of Factory Logos */}
        <div
          className={`factory-ring ${animating ? `ring-${animationType}` : ''}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            animation: animating ? 'none' : 'rotateRing 40s linear infinite',
          }}
        >
          {FACTORIES.map((factory, index) => {
            const { x, y, angle } = getLogoPosition(index, FACTORIES.length, 250);
            return (
              <div
                key={factory.id}
                className={`factory-logo ${animating ? `logo-${animationType}` : ''}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 107, 53, 0.2)',
                  opacity: animating ? 0 : 0.75,
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  animation: animating
                    ? `${animationType === 'convergence' ? 'convergeSpiral' : 'launchStreak'} 1s ease-in-out forwards`
                    : 'counterRotate 40s linear infinite',
                  animationDelay: animating ? `${index * 0.05}s` : '0s',
                  '--x': `${x}px`,
                  '--y': `${y}px`,
                  '--angle': `${angle}rad`,
                  '--index': index,
                }}
              >
                <img
                  src={factory.logo}
                  alt={factory.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '50%',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Center Sunbelt Logo */}
        <div
          className={`sunbelt-logo-container ${animating ? `sunbelt-${animationType}` : ''}`}
          style={{
            position: 'relative',
            zIndex: 10,
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'white',
            padding: '10px',
            boxShadow: `
              0 0 40px rgba(255, 107, 53, 0.5),
              0 0 80px rgba(255, 107, 53, 0.3),
              0 8px 32px rgba(0, 0, 0, 0.3)
            `,
            animation: animating
              ? (animationType === 'launch' ? 'sunbeltZoom 1s ease-in-out forwards' : 'sunbeltConverge 1s ease-in-out forwards')
              : 'pulse 3s ease-in-out infinite',
          }}
        >
          <img
            src={SunbeltLogo}
            alt="Sunbelt Modular"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Fade overlay during animation */}
      <div
        className="animation-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: animationType === 'convergence'
            ? 'radial-gradient(circle, rgba(255,107,53,0.8) 0%, rgba(255,255,255,1) 70%)'
            : 'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          opacity: animating ? 1 : 0,
          pointerEvents: animating ? 'all' : 'none',
          transition: 'opacity 0.4s ease',
          transitionDelay: '0.8s',
          zIndex: 100,
        }}
      />

      {/* Login Form */}
      <div
        className={`login-form-wrapper ${animating ? 'form-animating' : ''}`}
        style={{
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          zIndex: 20,
          marginTop: '320px',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(20px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Branding Text */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: 'var(--space-xs)',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
          }}>Sunbelt Modular</h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>Project Management System</p>
        </div>

        {/* Login Card */}
        <div
          className="card"
          style={{
            padding: 'var(--space-2xl)',
            background: 'rgba(26, 44, 71, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-sm)'
          }}>Sign In</h2>
          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-xl)',
            fontSize: '0.9375rem'
          }}>
            Enter your credentials to access your account
          </p>

          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              color: 'var(--danger)',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@sunbeltmodular.com"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: 'var(--space-lg)',
                fontSize: '1rem',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-gold))',
                border: 'none',
                boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', margin: 0 }}></div>
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

          <div style={{
            marginTop: 'var(--space-xl)',
            paddingTop: 'var(--space-xl)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <p>Need access? Contact your system administrator</p>
          </div>
        </div>

        <div style={{
          marginTop: 'var(--space-xl)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <p>&copy; 2026 Sunbelt Modular. All rights reserved.</p>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes counterRotate {
          from { transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) rotate(0deg); }
          to { transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) rotate(-360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow:
              0 0 40px rgba(255, 107, 53, 0.5),
              0 0 80px rgba(255, 107, 53, 0.3),
              0 8px 32px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 60px rgba(255, 107, 53, 0.7),
              0 0 120px rgba(255, 107, 53, 0.4),
              0 8px 32px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.5; }
        }

        /* Convergence Animation - Logos spiral inward */
        @keyframes converge {
          0% {
            opacity: 0.75;
            transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(1);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0, 0) scale(0) rotate(720deg);
          }
        }

        .ring-convergence {
          animation: ringAccelerate 0.8s ease-in forwards !important;
        }

        @keyframes ringAccelerate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(720deg); }
        }

        .logo-convergence {
          animation: convergeSpiral 1s ease-in forwards !important;
        }

        @keyframes convergeSpiral {
          0% {
            opacity: 0.75;
            transform: translate(-50%, -50%) translateX(var(--x)) translateY(var(--y)) scale(1);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(calc(var(--x) * 0.5)) translateY(calc(var(--y) * 0.5)) scale(1.1) rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateX(0) translateY(0) scale(0) rotate(720deg);
          }
        }

        @keyframes sunbeltConverge {
          0% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(255, 107, 53, 0.5), 0 0 80px rgba(255, 107, 53, 0.3);
          }
          50% {
            transform: scale(1.4);
            box-shadow: 0 0 100px rgba(255, 107, 53, 1), 0 0 200px rgba(255, 107, 53, 0.8);
          }
          80% {
            transform: scale(1.8);
            box-shadow: 0 0 200px rgba(255, 255, 255, 1), 0 0 400px rgba(255, 107, 53, 1);
          }
          100% {
            transform: scale(3);
            box-shadow: 0 0 300px rgba(255, 255, 255, 1), 0 0 500px rgba(255, 107, 53, 1);
            opacity: 0;
          }
        }

        /* Launch Animation - Logos streak outward */
        @keyframes launch {
          0% {
            opacity: 0.75;
            transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(1);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--tx, 0), var(--ty, 0)) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(calc(var(--tx, 0) * 3), calc(var(--ty, 0) * 3 - 200px)) scale(0.3);
            filter: blur(4px);
          }
        }

        .ring-launch {
          animation: ringTilt 0.6s ease-out forwards !important;
        }

        @keyframes ringTilt {
          0% { transform: rotate(0deg) perspective(1000px) rotateX(0deg); }
          100% { transform: rotate(180deg) perspective(1000px) rotateX(60deg); }
        }

        .logo-launch {
          animation: launchStreak 1s ease-in forwards !important;
        }

        @keyframes launchStreak {
          0% {
            opacity: 0.75;
            transform: translate(-50%, -50%) translateX(var(--x)) translateY(var(--y)) scale(1);
            filter: blur(0);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(var(--x)) translateY(var(--y)) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateX(calc(var(--x) * 4)) translateY(calc(var(--y) * 4 - 300px)) scale(0.2);
            filter: blur(8px);
          }
        }

        @keyframes sunbeltZoom {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(2);
            opacity: 1;
          }
          100% {
            transform: scale(6);
            opacity: 0;
          }
        }

        .sunbelt-launch {
          animation: sunbeltZoom 1s ease-in forwards !important;
        }

        /* Hover effects for factory logos */
        .factory-logo:hover {
          opacity: 1 !important;
          transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1.15) !important;
          z-index: 5;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .logo-ring-container {
            width: 400px !important;
            height: 400px !important;
          }

          .factory-logo {
            width: 45px !important;
            height: 45px !important;
          }

          .sunbelt-logo-container {
            width: 100px !important;
            height: 100px !important;
          }

          .login-form-wrapper {
            margin-top: 240px !important;
          }
        }

        @media (max-width: 480px) {
          .logo-ring-container {
            width: 300px !important;
            height: 300px !important;
          }

          .factory-logo {
            width: 35px !important;
            height: 35px !important;
          }

          .sunbelt-logo-container {
            width: 80px !important;
            height: 80px !important;
          }

          .login-form-wrapper {
            margin-top: 180px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
