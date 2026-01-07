import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--sidebar-bg)',
      padding: 'var(--space-xl)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--sunbelt-orange), var(--sunbelt-gold))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)'
          }}>
            <span style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'white'
            }}>SB</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: 'var(--space-xs)'
          }}>Sunbelt Modular</h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--sidebar-text)',
            fontWeight: 500,
            textTransform: 'uppercase'
          }}>Project Management System</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-2xl)' }}>
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
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
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
            borderTop: '1px solid var(--border-light)',
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
          color: 'var(--text-tertiary)'
        }}>
          <p>© 2026 Sunbelt Modular. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;