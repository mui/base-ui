import { createBenchmarkVitestConfig } from '@mui/internal-benchmark/vitest';

const config = createBenchmarkVitestConfig();

config.define = {
  ...config.define,
  'process.env.BENCHMARK_RENDER_COUNTS': JSON.stringify(process.env.BENCHMARK_RENDER_COUNTS),
};
if (process.env.BENCHMARK_RENDER_COUNTS === 'true' && config.test) {
  config.optimizeDeps = {
    exclude: ['@mui/internal-benchmark'],
    include: ['react-dom/client'],
  };
  config.test.reporters = ['default', './renderCountReporter.ts'];
}

export default config;
