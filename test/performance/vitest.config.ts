import { fileURLToPath } from 'node:url';
import { createBenchmarkVitestConfig } from '@mui/internal-benchmark/vitest';

const config = createBenchmarkVitestConfig();

if (process.env.BENCHMARK_RENDER_COUNTS === 'true' && config.test) {
  const wrapper = fileURLToPath(new URL('./benchmark.ts', import.meta.url));

  config.plugins = [
    ...(config.plugins ?? []),
    {
      name: 'base-ui-render-count-benchmark',
      enforce: 'pre',
      resolveId(source: string, importer: string | undefined) {
        // Redirecting the specifier rather than editing every fixture keeps this working on a
        // revision that predates the wrapper. The base side of a comparison is the merge base,
        // so a fixture-level import would leave it running the full warmup and sample counts
        // while the head ran a single iteration — two harnesses, one diff.
        if (source !== '@mui/internal-benchmark' || importer?.startsWith(wrapper)) {
          return null;
        }
        return wrapper;
      },
    },
  ];

  // The redirect happens during source resolution, so the package has to stay out of the
  // dependency pre-bundle to reach it. Excluding it also drops `react-dom/profiling` (aliased
  // from `react-dom/client`) out of the optimizer's entry graph, and discovering it on first
  // request would reload the page in the middle of the only measured iteration.
  config.optimizeDeps = {
    exclude: ['@mui/internal-benchmark'],
    include: ['react-dom/client'],
  };

  config.test.reporters = ['default', './renderCountReporter.ts'];
}

export default config;
