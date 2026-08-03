import {
  benchmark as runBenchmark,
  ElementTiming,
  type InteractionContext,
} from '@mui/internal-benchmark';
import type * as React from 'react';

export { ElementTiming };

type Interaction = (context: InteractionContext) => Promise<void> | void;
interface BenchmarkOptions {
  runs?: number;
  warmupRuns?: number;
  afterEach?: () => Promise<void> | void;
  reactRecordingPaused?: boolean;
}

/**
 * Runs a single measured iteration when CI only needs deterministic React render counts.
 * Full performance runs retain the benchmark package's normal warmup and sample counts.
 */
export function benchmark(
  name: string,
  render: () => React.ReactElement,
  interactionOrOptions?: Interaction | BenchmarkOptions,
  options?: BenchmarkOptions,
) {
  if (process.env.BENCHMARK_RENDER_COUNTS !== 'true') {
    runBenchmark(name, render, interactionOrOptions, options);
    return;
  }

  if (typeof interactionOrOptions === 'function') {
    runBenchmark(name, render, interactionOrOptions, {
      ...options,
      runs: 1,
      warmupRuns: 0,
    });
  } else {
    runBenchmark(name, render, {
      ...interactionOrOptions,
      runs: 1,
      warmupRuns: 0,
    });
  }
}
