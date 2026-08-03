import { benchmark as runBenchmark, type InteractionContext } from '@mui/internal-benchmark';
import type * as React from 'react';

// Fixtures resolve this module in place of the package, so it has to stand in for all of it.
export * from '@mui/internal-benchmark';

type Interaction = (context: InteractionContext) => Promise<void> | void;

// Mirrors the package's own options, which it declares but does not export.
interface BenchmarkOptions {
  runs?: number;
  warmupRuns?: number;
  afterEach?: () => Promise<void> | void;
  reactRecordingPaused?: boolean;
}

/**
 * Stands in for the package's `benchmark` when CI only needs deterministic React render counts.
 * `vitest.config.ts` resolves every fixture here in that mode; a full performance run never loads
 * this module and keeps the package's normal warmup and sample counts.
 *
 * One measured iteration is all a render count needs, and it is what makes the collection job
 * cheap enough to run on every pull request.
 */
export function benchmark(
  name: string,
  render: () => React.ReactElement,
  interactionOrOptions?: Interaction | BenchmarkOptions,
  options?: BenchmarkOptions,
) {
  const singleIteration = { runs: 1, warmupRuns: 0 };

  if (typeof interactionOrOptions === 'function') {
    runBenchmark(name, render, interactionOrOptions, { ...options, ...singleIteration });
  } else {
    runBenchmark(name, render, { ...interactionOrOptions, ...singleIteration });
  }
}
