import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        progress: resolve(__dirname, 'progress.html'),
        'bkt-study': resolve(__dirname, 'bkt-study.html'),
        'bkt-analytics': resolve(__dirname, 'bkt-analytics.html'),
        community: resolve(__dirname, 'community.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
