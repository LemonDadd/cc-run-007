import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 完全自包含构建，不引用任何外部 CDN
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1420,
    host: true,
  },
  preview: {
    port: 1420,
    host: true,
  },
  build: {
    outDir: 'dist',
    // 内联所有小资源，保证产物自包含
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1600,
  },
});
