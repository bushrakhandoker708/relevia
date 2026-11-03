// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site from /relevia/ (npm run deploy uses --mode pages).
  // I set it here instead of a --base=/relevia/ flag because Git Bash rewrites that
  // flag into a Windows path and the deployed site loads nothing.
  base: mode === 'pages' ? '/relevia/' : '/',

  plugins: [
    react(),
    // compression only when we build for production
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      filter: /\.(js|css|html|svg)$/,
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      filter: /\.(js|css|html|svg)$/,
    }),
  ],

  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          webllm: ['@mlc-ai/web-llm'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}));
