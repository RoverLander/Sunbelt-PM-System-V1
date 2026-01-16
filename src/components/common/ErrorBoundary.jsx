// ============================================================================
// ErrorBoundary.jsx
// ============================================================================
// Global error boundary that catches JavaScript errors anywhere in the app.
// Shows a friendly error message and reports errors to the database for IT.
//
// Features:
// - Catches render errors in child components
// - Shows friendly fallback UI
// - Reports errors to Supabase system_errors table
// - Allows users to report additional context
// - Provides "Try Again" functionality
//
// Usage: Wrap your app or specific sections with <ErrorBoundary>
// ============================================================================

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Send, Home, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showReportModal: false,
      userDescription: '',
      isReporting: false,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });

    // Auto-report to database
    this.reportErrorToDatabase(error, errorInfo, false);
  }

  getBrowserInfo = () => {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };
  };

  // eslint-disable-next-line no-unused-vars
  reportErrorToDatabase = async (error, errorInfo, _includeUserDescription = false) => {
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const errorRecord = {
        error_message: error?.message || error?.toString() || 'Unknown error',
        error_stack: error?.stack || null,
        component_stack: errorInfo?.componentStack || null,
        page_url: window.location.href,
        user_id: user?.id || null,
        browser_info: this.getBrowserInfo(),
        is_processed: false
      };

      const { error: insertError } = await supabase
        .from('system_errors')
        .insert([errorRecord]);

      if (insertError) {
        console.error('Failed to report error to database:', insertError);
      } else {
        console.log('Error reported to database successfully');
      }
    } catch (e) {
      console.error('Exception while reporting error:', e);
    }
  };

  handleReportSubmit = async () => {
    this.setState({ isReporting: true });

    try {
      // eslint-disable-next-line no-unused-vars
      const { error, errorInfo: _errorInfo, userDescription } = this.state;
      const { data: { user } } = await supabase.auth.getUser();

      // Create a ticket directly for user-submitted reports
      const { error: ticketError } = await supabase
        .from('error_tickets')
        .insert([{
          title: `User Report: ${error?.message?.substring(0, 100) || 'Application Error'}`,
          description: userDescription || 'User reported an error without additional details.',
          status: 'New',
          priority: 'Medium',
          reported_by: user?.id || null,
          error_message: error?.message || error?.toString(),
          page_url: window.location.href
        }]);

      if (ticketError) {
        console.error('Failed to create ticket:', ticketError);
      }

      this.setState({ reportSent: true, isReporting: false, showReportModal: false });
    } catch (e) {
      console.error('Exception while submitting report:', e);
      this.setState({ isReporting: false });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showReportModal: false,
      userDescription: '',
      reportSent: false
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, showReportModal, userDescription, isReporting, reportSent } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: '#1e293b',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={40} style={{ color: '#ef4444' }} />
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#f1f5f9',
              margin: '0 0 12px'
            }}>
              Something went wrong
            </h1>

            {/* Description */}
            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              margin: '0 0 24px'
            }}>
              We've encountered an unexpected error. Our IT team has been notified.
              {reportSent && (
                <span style={{ display: 'block', color: '#22c55e', marginTop: '8px' }}>
                  ✓ Your report has been submitted. Thank you!
                </span>
              )}
            </p>

            {/* Error message (collapsed) */}
            <details style={{
              textAlign: 'left',
              marginBottom: '24px',
              background: '#0f172a',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #334155'
            }}>
              <summary style={{
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                Technical details
              </summary>
              <pre style={{
                marginTop: '12px',
                color: '#ef4444',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                {error?.message || 'Unknown error'}
              </pre>
            </details>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                <RefreshCw size={18} />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#64748b';
                  e.target.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#475569';
                  e.target.style.color = '#94a3b8';
                }}
              >
                <Home size={18} />
                Go Home
              </button>

              {!reportSent && (
                <button
                  onClick={() => this.setState({ showReportModal: true })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'transparent',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <Send size={18} />
                  Report Issue
                </button>
              )}
            </div>

            {/* Report Modal */}
            {showReportModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  padding: '24px',
                  width: '90%',
                  maxWidth: '450px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1.1rem' }}>Report Issue to IT</h3>
                    <button
                      onClick={() => this.setState({ showReportModal: false })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                    Help us understand what happened. What were you trying to do when this error occurred?
                  </p>

                  <textarea
                    value={userDescription}
                    onChange={(e) => this.setState({ userDescription: e.target.value })}
                    placeholder="Describe what you were doing..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      marginBottom: '16px'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => this.setState({ showReportModal: false })}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={this.handleReportSubmit}
                      disabled={isReporting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: '#f59e0b',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: isReporting ? 'not-allowed' : 'pointer',
                        opacity: isReporting ? 0.7 : 1
                      }}
                    >
                      {isReporting ? 'Sending...' : 'Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
