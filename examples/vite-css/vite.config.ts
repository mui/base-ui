import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
const isProfile = process.env.REACT_PROFILING === '1';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@base-ui/react': resolve(__dirname, '..', '..', 'packages', 'react', 'src'),
      '@base-ui/utils': resolve(__dirname, '..', '..', 'packages', 'utils', 'src'),
      ...(isProfile ? { 'react-dom/client': 'react-dom/profiling' } : {}),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'state-workaround': resolve(__dirname, 'state-workaround.html'),
        'handle-fix': resolve(__dirname, 'handle-fix.html'),
      },
    },
  },
});
