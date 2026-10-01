import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import db from '../db';
import storage from './storageService';
import config from '../config';
import { MediaItem, MediaMetadata } from '../types/media';

export interface ExpressUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export class MediaService {
  async registerUploadedMedia(file: ExpressUploadedFile): Promise<MediaItem> {
    const id = uuidv4().slice(0, 12);
    const checksum = await storage.calculateChecksum(file.path);
    const thumbnailUrl = await storage.saveThumbnail(id, file.originalname, file.mimetype);

    const initialMetadata: MediaMetadata = {
      checksumSha256: checksum,
      originalExtension: path.extname(file.originalname).toLowerCase(),
      encoding: file.encoding,
      processingStage: 'INGESTED',
      pipelineVersion: '1.0.0',
    };

    const item = await db.insert({
      id,
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: 'QUEUED',
      filePath: file.path,
      thumbnailUrl,
      metadata: initialMetadata,
    });

    if (config.enableMockProcessing) {
      this.simulateProcessing(id).catch((err: any) =>
        console.error(`[MediaService] Processing error for ${id}:`, err.message)
      );
    }

    return item;
  }

  private async simulateProcessing(id: string): Promise<void> {
    await db.updateStatus(id, 'PROCESSING', {
      processingStage: 'TRANSCODING',
      processingStartedAt: new Date().toISOString(),
    });

    await this.delay(config.processingDelayMs);

    try {
      const mediaType = (await db.findById(id))?.mime_type || '';
      const isVideo = mediaType.startsWith('video');
      const isAudio = mediaType.startsWith('audio');
      const isImage = mediaType.startsWith('image');

      const codec = isVideo ? 'H.264/AAC' : isAudio ? 'AAC' : isImage ? 'WebP' : 'N/A';
      const dimensions = isVideo ? '1920x1080' : isImage ? '1024x768' : null;
      const estimatedDurationSeconds = isVideo ? 42.5 : isAudio ? 180.0 : null;

      const transcodedVersions = isVideo
        ? [
            { profile: '720p', status: 'READY' as const, format: 'mp4' },
            { profile: '480p', status: 'READY' as const, format: 'mp4' },
          ]
        : isAudio
        ? [{ profile: 'standard', status: 'READY' as const, format: 'aac' }]
        : [];

      await db.updateStatus(id, 'COMPLETED', {
        processingStage: 'COMPLETED',
        processingCompletedAt: new Date().toISOString(),
        codec,
        dimensions,
        estimatedDurationSeconds,
        transcodedVersions,
        complianceChecked: true,
        securityScan: 'PASSED',
      });
    } catch (err: any) {
      await db.updateStatus(id, 'FAILED', {
        processingStage: 'FAILED',
        processingCompletedAt: new Date().toISOString(),
      });
    }
  }

  async getAllMedia(): Promise<MediaItem[]> {
    return db.findAll();
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    return db.findById(id);
  }

  async reprocessMedia(id: string): Promise<MediaItem | null> {
    const item = await db.findById(id);
    if (!item) throw new Error(`Media ${id} not found.`);

    await db.updateStatus(id, 'QUEUED', {
      reprocessedAt: new Date().toISOString(),
    });

    if (config.enableMockProcessing) {
      this.simulateProcessing(id).catch((err: any) =>
        console.error(`[MediaService] Reprocess error for ${id}:`, err.message)
      );
    }

    return db.findById(id);
  }

  async deleteMedia(id: string): Promise<MediaItem | null> {
    const item = await db.findById(id);
    if (!item) return null;

    await storage.deleteFile(item.file_path);

    const thumbPath = path.join(storage.storageDir, 'thumbnails', `${id}.svg`);
    await storage.deleteFile(thumbPath);

    return db.delete(id);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mediaService = new MediaService();
export default mediaService;
