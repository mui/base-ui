import path from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@base-ui/react': path.resolve(__dirname, '..', '..', 'packages', 'react', 'src'),
      '@base-ui/utils': path.resolve(__dirname, '..', '..', 'packages', 'utils', 'src'),
      docs: path.resolve(__dirname, '..', '..', 'docs'),
    },
  },
  server: {
    fs: {
      // Allow serving Base UI source from the monorepo root.
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
});
