import { join } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  root: join(process.cwd(), 'test/regressions'),
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],

  resolve: {
    alias: {
      fs: null,
      stream: null,
      zlib: null,
    },
  },

  assetsInclude: [/\.(woff|woff2|eot|ttf|otf)$/i],
});
