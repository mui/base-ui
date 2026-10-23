import { configDefaults, mergeConfig } from 'vitest/config';
import { createBenchmarkVitestConfig } from '@mui/internal-benchmark/vitest';

export default mergeConfig(createBenchmarkVitestConfig(), {
  oxc: {
    jsx: { development: false },
  },
  test: {
    // Too slow to run on every PR; run it locally when changing `useAnimationsFinished`.
    exclude: process.env.CI
      ? [...configDefaults.exclude, 'tests/exit-animations.bench.tsx']
      : configDefaults.exclude,
  },
});
