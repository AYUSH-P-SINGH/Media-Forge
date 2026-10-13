import React from 'react';

interface NavbarProps {
  activeTab: 'dashboard' | 'upload' | 'library';
  setActiveTab: (tab: 'dashboard' | 'upload' | 'library') => void;
  systemHealth: string;
  itemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  itemCount,
}) => {
  return (
    <header className="app-header">
      <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h1>MediaForge</h1>
          <p className="subtitle">Cloud-Native Media Platform &bull; Kubernetes DevSecOps</p>
        </div>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </button>

        <button
          className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload
        </button>

        <button
          className={`nav-tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Media Library ({itemCount})
        </button>
      </nav>

      <div className="header-badges">
        <span className="badge badge-react">React 18</span>
        <span className="badge badge-k8s">Kubernetes</span>
        <div className={`health-pill ${systemHealth === 'ok' ? 'healthy' : 'degraded'}`}>
          <span className="status-dot"></span>
          <span>{systemHealth === 'ok' ? 'Live & Healthy' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
};
