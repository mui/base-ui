import { defineConfig } from 'vite';
import { benchmarkPlugin } from '@mui/internal-benchmark/vitePlugin';

// The plugin contributes everything derived from the `*.bench.tsx` files: a page per file as the
// build's entry points, the `src/` root and the index page.
export default defineConfig({ plugins: [benchmarkPlugin()] });
