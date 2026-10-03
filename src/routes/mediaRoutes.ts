import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import config from '../config';
import mediaController from '../controllers/mediaController';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not supported. Allowed: ${config.allowedMimeTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter
});

// Upload route with multer error handling
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g., file too large)
      return res.status(400).json({
        success: false,
        error: err.code === 'LIMIT_FILE_SIZE'
          ? `File exceeds the ${config.maxFileSizeMb}MB size limit.`
          : err.message
      });
    }
    if (err) {
      // Custom file filter errors
      return res.status(400).json({ success: false, error: err.message });
    }
    mediaController.upload(req, res, next);
  });
});

router.get('/', (req, res, next) => mediaController.list(req, res, next));
router.get('/:id', (req, res, next) => mediaController.getById(req, res, next));
router.post('/:id/process', (req, res, next) => mediaController.process(req, res, next));
router.delete('/:id', (req, res, next) => mediaController.delete(req, res, next));

export default router;
