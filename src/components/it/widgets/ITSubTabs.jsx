// ============================================================================
// ITSubTabs.jsx - Sub-Tab Navigation Component
// ============================================================================
// Tab bar for sub-navigation within a main tab
// ============================================================================

import React from 'react';

function ITSubTabs({
  tabs = [], // [{ id: string, label: string, icon?: Component, badge?: number }]
  activeTab,
  onTabChange,
  variant = 'default', // 'default' | 'pills' | 'underline'
  size = 'default' // 'small' | 'default'
}) {
  const sizeConfig = {
    small: { padding: '6px 12px', fontSize: '0.8125rem', iconSize: 14 },
    default: { padding: '8px 16px', fontSize: '0.875rem', iconSize: 16 }
  };

  const config = sizeConfig[size] || sizeConfig.default;

  // Pills variant
  if (variant === 'pills') {
    return (
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--bg-tertiary)',
        padding: '4px',
        borderRadius: '10px',
        width: 'fit-content'
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: config.padding,
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: config.fontSize,
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {tab.icon && <tab.icon size={config.iconSize} />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  padding: '2px 6px',
                  background: isActive ? 'var(--sunbelt-orange)' : 'var(--bg-tertiary)',
                  color: isActive ? 'white' : 'var(--text-tertiary)',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  if (variant === 'underline') {
    return (
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1px'
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: `${config.padding} 2px`,
                paddingTop: config.padding,
                paddingBottom: '10px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--sunbelt-orange)' : 'transparent'}`,
                marginBottom: '-2px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: config.fontSize,
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon && <tab.icon size={config.iconSize} />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  padding: '2px 6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant (button-like)
  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: config.padding,
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              borderRadius: '8px',
              color: isActive ? '#3b82f6' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: config.fontSize,
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.icon && <tab.icon size={config.iconSize} />}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{
                padding: '2px 6px',
                background: isActive ? '#3b82f6' : 'var(--bg-tertiary)',
                color: isActive ? 'white' : 'var(--text-tertiary)',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '600',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ITSubTabs;
