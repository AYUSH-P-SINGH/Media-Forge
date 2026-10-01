import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import config from './config';
import { createApp } from './app';

const app = createApp();
const server = http.createServer(app);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`
  ============================================================
   ! MediaForge - Cloud-Native Media Processing Platform !
  ============================================================
   * Language:         TypeScript (Node.js)
   * Port:             ${PORT}
   * Environment:      ${config.nodeEnv}
   * Dashboard UI:     http://localhost:${PORT}
   * Health Probe:     http://localhost:${PORT}/healthz
   * Readiness Probe:  http://localhost:${PORT}/readyz
   * Prometheus:       http://localhost:${PORT}/metrics
   * Storage Dir:      ${config.storageDir}
  ===========================================================
  `);
});

const handleShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[Server] HTTP server closed gracefully.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
