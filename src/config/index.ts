import path from 'path';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  storageDir: string;
  maxFileSizeMb: number;
  enableMockProcessing: boolean;
  processingDelayMs: number;
  allowedMimeTypes: string[];
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../uploads')),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  enableMockProcessing: process.env.ENABLE_MOCK_PROCESSING !== 'false',
  processingDelayMs: parseInt(process.env.PROCESSING_DELAY_MS || '2000', 10),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ]
};

export default config;
