import * as path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const shouldDisableWorkspaceAliases = Boolean(process.env.MUI_DISABLE_WORKSPACE_ALIASES);

export default defineConfig({
  mode: process.env.NODE_ENV || 'development',
  plugins: [react()],
  resolve: {
    alias: {
      ...(shouldDisableWorkspaceAliases
        ? // TODO: Remove and revert to `undefined` when calendar is publicly exported
          {
            '@base-ui/react/calendar': path.join(process.cwd(), 'packages/react/src/calendar'),
            '@base-ui/react/date-field': path.join(process.cwd(), 'packages/react/src/date-field'),
            '@base-ui/react/time-field': path.join(process.cwd(), 'packages/react/src/time-field'),
            '@base-ui/react/date-time-field': path.join(
              process.cwd(),
              'packages/react/src/date-time-field',
            ),
            '@base-ui/react/localization-provider': path.join(
              process.cwd(),
              'packages/react/src/localization-provider',
            ),
            '@base-ui/react/translations': path.join(
              process.cwd(),
              'packages/react/src/translations',
            ),
          }
        : {
            '@base-ui/react': path.join(process.cwd(), 'packages/react/src'),
            '@base-ui/utils': path.join(process.cwd(), 'packages/utils/src'),
          }),
      './fonts': path.join(process.cwd(), '/docs/src/fonts'),
      docs: path.join(process.cwd(), '/docs'),
      stream: null,
      zlib: null,
    },
  },
  build: { outDir: 'build', chunkSizeWarningLimit: 9999 },
});
