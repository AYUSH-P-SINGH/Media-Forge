export type MediaStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface TranscodedVersion {
  profile: string;
  status: 'READY' | 'PENDING' | 'FAILED';
  format: string;
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
  [key: string]: unknown;
}

export interface MediaItem {
  id: string;
  original_name: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: MediaStatus;
  file_path: string;
  thumbnail_url: string | null;
  metadata: MediaMetadata;
  created_at: string;
  updated_at: string;
}

export interface CreateMediaDTO {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status?: MediaStatus;
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
