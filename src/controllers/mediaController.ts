import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import mediaService, { ExpressUploadedFile } from '../services/mediaService';
import storage from '../services/storageService';
import { MediaStats } from '../types/media';

export class MediaController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No media file provided. Please attach a file using the "file" form-data field.'
        });
        return;
      }

      const media = await mediaService.registerUploadedMedia(req.file as ExpressUploadedFile);

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully and registered in processing queue.',
        data: media
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await mediaService.getAllMedia();
      const stats: MediaStats = {
        total: items.length,
        queued: items.filter(i => i.status === 'QUEUED').length,
        processing: items.filter(i => i.status === 'PROCESSING').length,
        completed: items.filter(i => i.status === 'COMPLETED').length,
        failed: items.filter(i => i.status === 'FAILED').length,
        totalSizeBytes: items.reduce((acc, i) => acc + parseInt(String(i.size_bytes || 0), 10), 0)
      };

      res.json({
        success: true,
        stats,
        data: items
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid media ID format' });
        return;
      }
      const item = await mediaService.getMediaById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid media ID format' });
        return;
      }
      const status = await mediaService.getProcessingStatus(id);
      if (!status) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      res.json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, version } = req.params;

      // Validate ID format to prevent directory traversal
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid media ID format' });
        return;
      }

      // Validate version format if provided
      if (version && !/^[a-zA-Z0-9_-]+$/.test(version)) {
        res.status(400).json({ success: false, error: 'Invalid version identifier' });
        return;
      }

      const item = await mediaService.getMediaById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }

      // If specific transcoded version is requested (e.g. 720p, 480p)
      if (version) {
        const transcodes = (item.metadata?.transcodedVersions as any[]) || [];
        const match = transcodes.find((t: any) => t.profile && t.profile.toLowerCase() === version.toLowerCase());
        const ext = match?.format ? `.${match.format}` : '.mp4';
        const processedFile = match?.filePath
          ? path.resolve(match.filePath)
          : path.resolve(storage.processedDir, `${id}_${version}${ext}`);

        // Verify path stays within processedDir
        if (!processedFile.startsWith(path.resolve(storage.processedDir))) {
          res.status(403).json({ success: false, error: 'Access denied: invalid storage path' });
          return;
        }

        if (fs.existsSync(processedFile)) {
          const extName = path.extname(processedFile) || ext;
          const downloadName = `${path.parse(item.original_name).name}_${version}${extName}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
          res.download(processedFile, downloadName);
          return;
        }

        res.status(404).json({
          success: false,
          error: `Transcoded version '${version}' not found for media asset`
        });
        return;
      }

      // Default: download original file if exists
      const originalFile = path.resolve(item.file_path);
      if (!originalFile.startsWith(path.resolve(storage.storageDir))) {
        res.status(403).json({ success: false, error: 'Access denied: invalid file path' });
        return;
      }

      if (fs.existsSync(originalFile)) {
        const safeOriginalName = path.basename(item.original_name).replace(/[^a-zA-Z0-9_.-]/g, '_');
        res.download(originalFile, safeOriginalName);
        return;
      }

      res.status(404).json({ success: false, error: 'Media file not found on storage disk' });
    } catch (err) {
      next(err);
    }
  }

  async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid media ID format' });
        return;
      }
      const item = await mediaService.getMediaById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      const result = await mediaService.reprocessMedia(id);
      res.json({
        success: true,
        message: `Processing re-triggered for media ${id}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid media ID format' });
        return;
      }
      const result = await mediaService.deleteMedia(id);
      if (!result) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      res.json({
        success: true,
        message: `Media ${id} removed successfully.`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
export default mediaController;
