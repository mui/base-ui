import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const reactSrc = path.resolve(dirname, '../../packages/react/src');
const utilsSrc = path.resolve(dirname, '../../packages/utils/src');

// The workspace symlink for @base-ui/react points at packages/react/build
// (pnpm honors publishConfig.directory), which only exists after a package build.
// Alias to the TypeScript source instead, exactly like docs/ does via tsconfig paths,
// so stories always exercise the live source in this repo.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@base-ui\/react\/(.*)$/, replacement: `${reactSrc}/$1` },
      { find: /^@base-ui\/react$/, replacement: reactSrc },
      { find: /^@base-ui\/utils\/(.*)$/, replacement: `${utilsSrc}/$1` },
      { find: /^@base-ui\/utils$/, replacement: utilsSrc },
    ],
    dedupe: ['react', 'react-dom'],
  },
});
