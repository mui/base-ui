import fs from 'node:fs/promises';
import path from 'node:path';
import type { Reporter, TestCase } from 'vitest/node';
import type { IterationData } from '@mui/internal-benchmark';

interface RenderCountMeta {
  benchmarkIterations?: IterationData[];
  benchmarkName?: string;
}

export default class RenderCountReporter implements Reporter {
  private report: Record<string, { totalDuration: 0; renders: unknown[] }> = {};

  onTestRunStart() {
    this.report = {};
  }

  onTestCaseResult(testCase: TestCase) {
    const meta = testCase.meta() as RenderCountMeta;
    const renders = meta.benchmarkIterations?.[0]?.renders;
    if (!renders) {
      return;
    }

    const name = meta.benchmarkName ?? testCase.fullName;
    this.report[name] = { totalDuration: 0, renders };
    process.stdout.write(`  ${name}: ${renders.length} renders\n`);
  }

  async onTestRunEnd() {
    const outputPath =
      process.env.BENCHMARK_OUTPUT_PATH ??
      path.resolve(process.cwd(), 'benchmarks', 'results.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify({ report: this.report }, null, 2));
  }
}
