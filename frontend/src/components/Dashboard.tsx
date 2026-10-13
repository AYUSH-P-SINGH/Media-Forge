import React from 'react';
import { MediaItem } from '../types';

interface DashboardProps {
  media: MediaItem[];
  onNavigate: (tab: 'dashboard' | 'upload' | 'library') => void;
  onSelectMedia: (item: MediaItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ media, onNavigate, onSelectMedia }) => {
  const total = media.length;
  const completed = media.filter(m => m.status === 'COMPLETED').length;
  const pending = media.filter(m => m.status === 'QUEUED' || m.status === 'PROCESSING').length;
  const failed = media.filter(m => m.status === 'FAILED').length;
  const totalBytes = media.reduce((acc, m) => acc + (m.file_size || m.size_bytes || 0), 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const recentItems = [...media].slice(0, 5);

  return (
    <div className="dashboard-view">
      <div className="section-header">
        <div>
          <h2>System Operations Dashboard</h2>
          <p className="section-subtitle">Real-time status of MediaForge distributed ingestion and transcoding pipeline</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('upload')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Upload New Media
          </button>
        </div>
      </div>

      {/* Metrics Overview: 4 Roadmap Stats + Total Size */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Media</div>
          <div className="stat-value">{total}</div>
          <div className="stat-desc">Ingested files in catalog</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value text-emerald">{completed}</div>
          <div className="stat-desc">Ready for playback & distribution</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending / Processing</div>
          <div className="stat-value text-cyan">{pending}</div>
          <div className="stat-desc">Active transcoding queue</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed Items</div>
          <div className="stat-value text-rose">{failed}</div>
          <div className="stat-desc">Validation or codec errors</div>
        </div>
      </section>

      {/* Secondary Metrics / Pipeline Info */}
      <div className="dashboard-split">
        <div className="panel recent-panel">
          <div className="panel-header">
            <h3>Recent Media Activity</h3>
            <button className="btn-link" onClick={() => onNavigate('library')}>View all &rarr;</button>
          </div>

          {recentItems.length === 0 ? (
            <div className="empty-state-sm">
              <p>No media files uploaded yet.</p>
              <button className="btn btn-sm btn-primary" onClick={() => onNavigate('upload')}>Upload File</button>
            </div>
          ) : (
            <div className="activity-list">
              {recentItems.map(item => (
                <div key={item.id} className="activity-item" onClick={() => onSelectMedia(item)}>
                  <div className="activity-icon">
                    {item.content_type?.startsWith('video') ? '🎬' : item.content_type?.startsWith('audio') ? '🎵' : '🖼️'}
                  </div>
                  <div className="activity-info">
                    <span className="activity-name">{item.original_name}</span>
                    <span className="activity-meta">
                      {formatBytes(item.file_size || item.size_bytes || 0)} &bull; {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={`status-badge status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel system-panel">
          <div className="panel-header">
            <h3>Infrastructure & Storage Status</h3>
          </div>
          <div className="system-stats">
            <div className="sys-row">
              <span>Total Storage Used</span>
              <strong>{formatBytes(totalBytes)}</strong>
            </div>
            <div className="sys-row">
              <span>Database Engine</span>
              <span className="badge badge-postgres">PostgreSQL 16 / Memory</span>
            </div>
            <div className="sys-row">
              <span>Transcoding Pipeline</span>
              <span className="badge badge-ffmpeg">FFmpeg Multi-Stage</span>
            </div>
            <div className="sys-row">
              <span>Container Orchestration</span>
              <span className="badge badge-k8s">Kubernetes Workloads</span>
            </div>
            <div className="sys-row">
              <span>Security Hardening</span>
              <span className="badge badge-devsecops">DevSecOps Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
