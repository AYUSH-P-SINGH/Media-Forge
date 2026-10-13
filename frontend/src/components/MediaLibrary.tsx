import React, { useState } from 'react';
import { MediaItem } from '../types';

interface MediaLibraryProps {
  media: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onReprocess: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  media,
  onSelectMedia,
  onReprocess,
  onDelete,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image' | 'doc'>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMedia = media.filter(item => {
    const contentType = item.content_type || item.mime_type || '';
    const matchesFilter =
      filter === 'all' ||
      (filter === 'video' && contentType.startsWith('video')) ||
      (filter === 'audio' && contentType.startsWith('audio')) ||
      (filter === 'image' && contentType.startsWith('image')) ||
      (filter === 'doc' && (contentType.includes('pdf') || contentType.includes('text')));

    const matchesSearch =
      search === '' ||
      item.original_name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete this media asset?`)) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleReprocessClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReprocessingId(id);
    try {
      await onReprocess(id);
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="library-view">
      <div className="section-header">
        <div>
          <h2>Media Assets Catalog</h2>
          <p className="section-subtitle">Catalog of ingested media, multi-bitrate transcodes, and metadata records</p>
        </div>
        <div className="catalog-actions">
          <button className="btn btn-outline" onClick={onRefresh}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh Catalog
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="catalog-toolbar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by file name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({media.length})</button>
          <button className={`filter-btn ${filter === 'video' ? 'active' : ''}`} onClick={() => setFilter('video')}>Videos</button>
          <button className={`filter-btn ${filter === 'audio' ? 'active' : ''}`} onClick={() => setFilter('audio')}>Audio</button>
          <button className={`filter-btn ${filter === 'image' ? 'active' : ''}`} onClick={() => setFilter('image')}>Images</button>
          <button className={`filter-btn ${filter === 'doc' ? 'active' : ''}`} onClick={() => setFilter('doc')}>Documents</button>
        </div>
      </div>

      {/* Grid of Media Cards */}
      {filteredMedia.length === 0 ? (
        <div className="empty-catalog">
          <div className="empty-icon">📁</div>
          <h3>No Media Assets Found</h3>
          <p>No media files match your current filter or search criteria.</p>
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map(item => {
            const isProcessing = item.status === 'QUEUED' || item.status === 'PROCESSING';
            const size = item.file_size || item.size_bytes || 0;
            const ext = item.original_name.split('.').pop()?.toUpperCase() || 'FILE';

            return (
              <div key={item.id} className="media-card" onClick={() => onSelectMedia(item)}>
                {/* Thumbnail Header */}
                <div className="card-thumb-wrapper">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.original_name} className="card-thumb" />
                  ) : (
                    <div className="card-thumb-placeholder">
                      <span>{ext}</span>
                    </div>
                  )}

                  <div className={`card-status-badge status-${item.status.toLowerCase()}`}>
                    {isProcessing && <span className="status-spinner"></span>}
                    {item.status}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <h4 className="card-title" title={item.original_name}>{item.original_name}</h4>
                  <div className="card-metadata-row">
                    <span className="file-tag">{ext}</span>
                    <span className="file-size">{formatBytes(size)}</span>
                    <span className="file-date">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  {item.metadata?.dimensions && (
                    <div className="card-dims">Resolution: {item.metadata.dimensions}</div>
                  )}

                  {/* Actions: Download, Details, Reprocess, Delete */}
                  <div className="card-footer-actions">
                    <a
                      href={`/api/media/${item.id}/download`}
                      download
                      className="btn-icon"
                      title="Download Media File"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </a>

                    <button
                      className="btn-icon"
                      title="Reprocess Media"
                      disabled={reprocessingId === item.id}
                      onClick={(e) => handleReprocessClick(e, item.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </button>

                    <button
                      className="btn-icon btn-danger"
                      title="Delete Asset"
                      disabled={deletingId === item.id}
                      onClick={(e) => handleDeleteClick(e, item.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>

                    <button
                      className="btn-inspect"
                      onClick={() => onSelectMedia(item)}
                    >
                      Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
