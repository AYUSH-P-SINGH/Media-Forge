import path from 'path';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
import db from './db';
import healthRoutes from './routes/healthRoutes';
import mediaRoutes from './routes/mediaRoutes';

export function createApp(): Application {
  const app = express();

  // Initialize DB asynchronously
  db.initialize(config.databaseUrl).catch((err: any) => {
    console.warn('[App] DB init warning:', err.message);
  });

  // Security & Hardening
  app.disable('x-powered-by');
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Core Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Static files for Web UI and Uploads
  app.use(express.static(path.join(__dirname, '../public'), {
    dotfiles: 'ignore',
    index: 'index.html'
  }));

  // Uploads served with nosniff and sandboxed CSP to eliminate Stored XSS vectors
  app.use('/uploads', express.static(config.storageDir, {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
  }));

  // Health and Observability
  app.use('/', healthRoutes);

  // Media API Routes (supports both /api/media and /api/v1/media)
  app.use('/api/media', mediaRoutes);
  app.use('/api/v1/media', mediaRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(config.nodeEnv !== 'production' && { stack: err.stack })
    });
  });


  return app;
}

export default createApp;
