import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@base-ui-components/react': path.resolve(__dirname, '..', '..', 'packages', 'react', 'src'),
      '@base-ui-components/utils': path.resolve(__dirname, '..', '..', 'packages', 'utils', 'src'),
    },
  },
  server: {
    fs: {
      // Allow serving Base UI source from the monorepo root.
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
})
