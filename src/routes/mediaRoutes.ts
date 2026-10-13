import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import config from '../config';
import storage from '../services/storageService';
import mediaController from '../controllers/mediaController';

const router = Router();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    storage.initDirectories();
    cb(null, storage.originalsDir);
  },
  filename: (req, file, cb) => {
    // Generate safe unique filename
    const safeBaseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not supported. Allowed types: ${config.allowedMimeTypes.join(', ')}`));
  }
};

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter
});

// Upload route with multer error handling
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: err.code === 'LIMIT_FILE_SIZE'
          ? `File exceeds the ${config.maxFileSizeMb}MB size limit.`
          : err.message
      });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    mediaController.upload(req, res, next);
  });
});

// List all media
router.get('/', (req, res, next) => mediaController.list(req, res, next));

// Processing status endpoint
router.get('/:id/status', (req, res, next) => mediaController.getStatus(req, res, next));

// Download original or transcoded media
router.get('/:id/download', (req, res, next) => mediaController.download(req, res, next));
router.get('/:id/download/:version', (req, res, next) => mediaController.download(req, res, next));

// Get media by ID
router.get('/:id', (req, res, next) => mediaController.getById(req, res, next));

// Reprocess media
router.post('/:id/process', (req, res, next) => mediaController.process(req, res, next));

// Delete media
router.delete('/:id', (req, res, next) => mediaController.delete(req, res, next));

export default router;
