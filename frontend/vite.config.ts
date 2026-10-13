import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: false,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
