import * as path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],

  resolve: {
    alias: {
      '@base-ui-components/react': path.join(process.cwd(), 'packages/react/src'),
      './fonts': path.join(process.cwd(), '/docs/src/fonts'),
      docs: path.join(process.cwd(), '/docs'),
      stream: null,
      zlib: null,
    },
  },

  build: { outDir: 'build', chunkSizeWarningLimit: 9999 },
});
