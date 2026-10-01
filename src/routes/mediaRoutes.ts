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

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 }
});

router.post(/upload', upload.single('file'), (req, res, next) => mediaController.upload(req, res, next));
router.get('/', (req, res, next) => mediaController.list(req, res, next));
router.get('/:id', (req, res, next) => mediaController.getById(req, res, next));
router.post('/:id/process', (req, res, next) => mediaController.process(req, res, next));
router.delete('/:id', (req, res, next) => mediaController.delete(req, res, next));

export default router;
