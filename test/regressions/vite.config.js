import * as path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.join(process.cwd(), 'test/regressions'),
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],

  resolve: {
    alias: {
      './fonts': path.resolve(__dirname, '../../docs/src/fonts'),
      docs: path.resolve(__dirname, '../../docs'),
      stream: null,
      zlib: null,
    },
  },
});
