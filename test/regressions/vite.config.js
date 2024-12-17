import * as path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  root: path.join(process.cwd(), 'test/regressions'),
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],

  resolve: {
    alias: {
      docs: path.resolve(__dirname, '../../docs'),
      fs: null,
      stream: null,
      zlib: null,
    },
  },

  assetsInclude: [/\.(woff|woff2|eot|ttf|otf)$/i],
});
