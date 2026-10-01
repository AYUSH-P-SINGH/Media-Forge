import { Router, Request, Response } from 'express';
import db from '../db';
import storage from '../services/storageService';

const router = Router();

let requestCount = 0;
const startTime = Date.now();

router.use((req, res, next) => {
  requestCount++;
  next();
});

router.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    service: 'mediaforge-core',
    language: 'TypeScript'
  });
});

router.get('/readyz', async (req: Request, res: Response) => {
  const dbHealth = await db.checkHealth();
  const storageOk = storage.isWritable();
  const isReady = dbHealth.status !== 'unhealthy' && storageOk;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    database: dbHealth,
    storage: { writable: storageOk },
    timestamp: new Date().toISOString()
  });
});

router.get('/metrics', async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memory = process.memoryUsage();
  const items = await db.findAll().catch(() => []);

  const metricsText = [
    '# HELP mediaforge_http_requests_total Total number of HTTP requests processed',
    '# TYPE mediaforge_http_requests_total counter',
    `mediaforge_http_requests_total ${requestCount}`,
    '',
    '# HELP mediaforge_uptime_seconds Application uptime in seconds',
    '# TYPE mediaforge_uptime_seconds gauge',
    `mediaforge_uptime_seconds ${uptime}`,
    '',
    '# HELP mediaforge_media_items_total Number of registered media items',
    '# TYPE mediaforge_media_items_total gauge',
    `mediaforge_media_items_total ${items.length}`,
    '',
    '# HELP mediaforge_memory_heap_used_bytes Process heap memory usage in bytes',
    '# TYPE mediaforge_memory_heap_used_bytes gauge',
    `mediaforge_memory_heap_used_bytes ${memory.heapUsed}`,
    ''
  ].join('\n');

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metricsText);
});

export default router;
