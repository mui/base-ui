import { mergeConfig } from 'vitest/config';
import { createBenchmarkVitestConfig } from '@mui/internal-benchmark/vitest';

export default mergeConfig(createBenchmarkVitestConfig(), {
  // Keep the JSX transform compatible with the benchmark's production React runtime.
  oxc: {
    jsx: { development: false },
  },
});
