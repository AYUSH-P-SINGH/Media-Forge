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
      const item = await mediaService.getMediaById(req.params.id);
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
      const status = await mediaService.getProcessingStatus(req.params.id);
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
      const item = await mediaService.getMediaById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }

      // If specific transcoded version is requested (e.g. 720p, 480p)
      if (version) {
        const processedFile = path.join(storage.processedDir, `${id}_${version}.mp4`);
        if (fs.existsSync(processedFile)) {
          res.download(processedFile, `${path.parse(item.original_name).name}_${version}.mp4`);
          return;
        }
      }

      // Default: download original file if exists
      if (fs.existsSync(item.file_path)) {
        res.download(item.file_path, item.original_name);
        return;
      }

      res.status(404).json({ success: false, error: 'Media file not found on storage disk' });
    } catch (err) {
      next(err);
    }
  }

  async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await mediaService.getMediaById(req.params.id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      const result = await mediaService.reprocessMedia(req.params.id);
      res.json({
        success: true,
        message: `Processing re-triggered for media ${req.params.id}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await mediaService.deleteMedia(req.params.id);
      if (!result) {
        res.status(404).json({ success: false, error: 'Media not found' });
        return;
      }
      res.json({
        success: true,
        message: `Media ${req.params.id} removed successfully.`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
export default mediaController;
