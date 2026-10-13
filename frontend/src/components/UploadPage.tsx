import React, { useState, useRef } from 'react';
import { MediaItem } from '../types';

interface UploadPageProps {
  onUploadSuccess: (item: MediaItem) => void;
  onNavigateToLibrary: () => void;
}

const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mp3', '.wav', '.ogg', '.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_FILE_SIZE_MB = 50;

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadSuccess, onNavigateToLibrary }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedItem, setUploadedItem] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    setUploadedItem(null);

    // Validation 1: Size
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      setError(`File size (${fileSizeMb.toFixed(1)}MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Validation 2: Extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File format '${ext}' is not supported. Allowed formats: MP4, WEBM, MOV, MP3, WAV, PNG, JPG, WEBP, PDF.`);
      return;
    }

    uploadFile(file);
  };

  const uploadFile = (file: File) => {
    setUploading(true);
    setProgress(10);
    setStatusMessage(`Preparing ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 90);
        setProgress(percent);
        setStatusMessage(`Uploading: ${percent}%...`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setStatusMessage('Upload complete! Ingesting into transcoding queue...');
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data) {
            setUploadedItem(res.data);
            onUploadSuccess(res.data);
          } else {
            setError(res.error || 'Server reported an error during upload.');
          }
        } catch {
          setStatusMessage('Uploaded successfully.');
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.error || `Upload failed with status code ${xhr.status}`);
        } catch {
          setError(`Upload failed with HTTP status ${xhr.status}`);
        }
      }
      setUploading(false);
    });

    xhr.addEventListener('error', () => {
      setError('Network connection error occurred while transferring file.');
      setUploading(false);
    });

    xhr.open('POST', '/api/media/upload');
    xhr.send(formData);
  };

  return (
    <div className="upload-view">
      <div className="section-header">
        <div>
          <h2>Ingest Media Assets</h2>
          <p className="section-subtitle">Upload video, audio, image, or document assets for automated multi-stage transcoding</p>
        </div>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dragover' : ''} ${uploading ? 'uploading-state' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <h3>Drag & Drop Media Files Here</h3>
        <p>Or click the button below to browse from your device</p>

        <div className="formats-supported">
          <span>MP4</span><span>WEBM</span><span>MOV</span><span>PNG</span><span>JPG</span><span>WEBP</span><span>MP3</span><span>WAV</span><span>PDF</span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="video/*,audio/*,image/*,.pdf"
        />

        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Processing Upload...' : 'Select File From Device'}
        </button>

        <p className="upload-limit-note">Maximum file size: {MAX_FILE_SIZE_MB}MB &bull; Automated SHA-256 Checksum Validation</p>

        {uploading && (
          <div className="upload-progress-container">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-status-row">
              <span className="progress-label">{statusMessage}</span>
              <span className="progress-percent">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          <div>
            <strong>Upload Failed:</strong> {error}
          </div>
        </div>
      )}

      {uploadedItem && (
        <div className="alert alert-success">
          <div className="alert-icon">✅</div>
          <div className="alert-content">
            <strong>Upload Successful!</strong> File <code>{uploadedItem.original_name}</code> is registered in MediaForge.
            <div className="alert-actions">
              <button className="btn btn-sm btn-outline" onClick={onNavigateToLibrary}>
                View in Media Library &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
