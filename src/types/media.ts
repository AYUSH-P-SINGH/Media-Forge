export type MediaStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface TranscodedVersion {
  profile: string;
  status: 'READY' | 'PENDING' | 'FAILED';
  format: string;
  filePath?: string;
  storageKey?: string;
  downloadUrl?: string;
  fileSizeBytes?: number;
}

export interface MediaMetadata {
  checksumSha256?: string;
  originalExtension?: string;
  encoding?: string;
  processingStage?: string;
  pipelineVersion?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  reprocessedAt?: string;
  codec?: string;
  dimensions?: string | null;
  estimatedDurationSeconds?: number | null;
  transcodedVersions?: TranscodedVersion[];
  complianceChecked?: boolean;
  securityScan?: string;
  ffmpegUsed?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface MediaItem {
  id: string;
  original_name: string;
  storage_key: string;
  content_type: string;
  file_size: number;
  status: MediaStatus;
  created_at: string;
  // Aliases and rich fields for backwards compatibility and frontend display
  file_name: string;
  mime_type: string;
  size_bytes: number;
  file_path: string;
  thumbnail_url: string | null;
  metadata: MediaMetadata;
  updated_at: string;
}

export interface CreateMediaDTO {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status?: MediaStatus;
  storageKey?: string;
  filePath: string;
  thumbnailUrl?: string | null;
  metadata?: MediaMetadata;
}

export interface MediaStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  totalSizeBytes: number;
}

export interface ProcessingStatusResponse {
  id: string;
  originalName: string;
  status: MediaStatus;
  stage: string;
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
  thumbnailUrl: string | null;
  transcodedVersions: TranscodedVersion[];
  metadata: MediaMetadata;
}
