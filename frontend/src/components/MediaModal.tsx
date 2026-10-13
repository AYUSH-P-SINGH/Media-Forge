import React from 'react';
import { MediaItem } from '../types';

interface MediaModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onReprocess: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MediaModal: React.FC<MediaModalProps> = ({ item, onClose, onReprocess, onDelete }) => {
  if (!item) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const transcodes = item.metadata?.transcodedVersions || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{item.original_name}</h3>
            <span className="modal-id">ID: <code>{item.id}</code></span>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="modal-preview-col">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt="Thumbnail preview" className="modal-thumb-img" />
            ) : (
              <div className="modal-thumb-fallback">No Thumbnail</div>
            )}

            <div className="modal-actions-col">
              <a
                href={`/api/media/${item.id}/download`}
                download
                className="btn btn-primary btn-block"
              >
                Download Original ({formatBytes(item.file_size || item.size_bytes || 0)})
              </a>

              <button
                className="btn btn-outline btn-block"
                onClick={() => {
                  onReprocess(item.id);
                  onClose();
                }}
              >
                Trigger Reprocess Pipeline
              </button>

              <button
                className="btn btn-danger-outline btn-block"
                onClick={() => {
                  if (window.confirm('Delete this media asset?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
              >
                Delete Asset Permanently
              </button>
            </div>
          </div>

          <div className="modal-info-col">
            <h4 className="info-title">Processing & Technical Metadata</h4>
            <div className="info-table">
              <div className="info-row">
                <span className="info-k">Pipeline Status:</span>
                <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Stage:</span>
                <span>{item.metadata?.processingStage || item.status}</span>
              </div>
              <div className="info-row">
                <span className="info-k">MIME Type:</span>
                <code>{item.content_type || item.mime_type}</code>
              </div>
              <div className="info-row">
                <span className="info-k">File Size:</span>
                <span>{formatBytes(item.file_size || item.size_bytes || 0)}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Storage Path:</span>
                <code className="text-truncate">{item.storage_key || item.file_path}</code>
              </div>
              <div className="info-row">
                <span className="info-k">Codec:</span>
                <span>{item.metadata?.codec || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Dimensions:</span>
                <span>{item.metadata?.dimensions || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-k">Duration:</span>
                <span>{item.metadata?.estimatedDurationSeconds ? `${item.metadata.estimatedDurationSeconds}s` : 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-k">SHA-256 Checksum:</span>
                <code className="text-truncate">{item.metadata?.checksumSha256 || 'N/A'}</code>
              </div>
              <div className="info-row">
                <span className="info-k">Created At:</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>

            {transcodes.length > 0 && (
              <div className="transcode-section">
                <h4 className="info-title">Transcoded Deliverables</h4>
                <div className="transcode-list">
                  {transcodes.map((t, i) => (
                    <div key={i} className="transcode-row">
                      <span className="profile-name">{t.profile} ({t.format.toUpperCase()})</span>
                      <span className="profile-status badge badge-sm">{t.status}</span>
                      <a
                        href={`/api/media/${item.id}/download/${t.profile}`}
                        download
                        className="btn-download-sm"
                      >
                        Download {t.profile}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
