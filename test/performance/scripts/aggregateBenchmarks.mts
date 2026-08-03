import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  benchmarkUploadSchema,
  type BenchmarkBaseUpload,
  type BenchmarkReportEntry,
  type BenchmarkUpload,
  type MetricStats,
} from '@mui/internal-benchmark/ciReport';

type BenchmarkReportData = Omit<BenchmarkBaseUpload, 'report'> & {
  report: Record<string, BenchmarkReportEntry>;
};

export type BenchmarkReport = Omit<BenchmarkUpload, 'report' | 'base'> & {
  report: Record<string, BenchmarkReportEntry>;
  base?: BenchmarkReportData;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
  assert(typeof value === 'number' && Number.isFinite(value), `${name} must be a finite number.`);
}

function readReport(file: string): BenchmarkReport {
  return benchmarkUploadSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8'))) as BenchmarkReport;
}

function sameJson(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function withoutBase(report: BenchmarkReport): BenchmarkReportData {
  const { base, ...singleReport } = report;
  void base;
  return singleReport;
}

function combineStats(
  first: MetricStats,
  second: MetricStats,
  firstCount: number,
  secondCount: number,
): MetricStats {
  const firstUsed = Math.max(0, firstCount - first.outliers);
  const secondUsed = Math.max(0, secondCount - second.outliers);
  const count = firstUsed + secondUsed;
  assert(count > 0, 'Cannot combine statistics without samples.');

  const mean = (first.mean * firstUsed + second.mean * secondUsed) / count;
  const variance =
    (firstUsed * (first.stdDev ** 2 + (first.mean - mean) ** 2) +
      secondUsed * (second.stdDev ** 2 + (second.mean - mean) ** 2)) /
    count;

  return {
    mean,
    stdDev: Math.sqrt(variance),
    outliers: first.outliers + second.outliers,
  };
}

function validateCompatibleMetadata(first: BenchmarkReport, second: BenchmarkReport) {
  for (const key of ['version', 'commitSha', 'repo', 'reportType', 'prNumber', 'branch'] as const) {
    assert(first[key] === second[key], `Benchmark metadata differs for ${key}.`);
  }
  assert(
    sameJson(first.metricDefinitions, second.metricDefinitions),
    'Benchmark metric definitions differ between runs.',
  );
}

function combineEntry(
  name: string,
  first: BenchmarkReportEntry,
  second: BenchmarkReportEntry,
): BenchmarkReportEntry {
  assertFiniteNumber(first.iterations, `${name}.iterations`);
  assertFiniteNumber(second.iterations, `${name}.iterations`);
  assert(first.iterations > 0 && second.iterations > 0, `${name} has no benchmark iterations.`);
  assert(
    first.renders.length === second.renders.length,
    `${name} produced different render counts.`,
  );

  const renders = first.renders.map((firstRender, index) => {
    const secondRender = second.renders[index];
    assert(
      firstRender.id === secondRender.id && firstRender.phase === secondRender.phase,
      `${name} produced a different render sequence at index ${index}. Two runs of the same ` +
        'revision must render identically, so this benchmark is nondeterministic.',
    );
    const duration = combineStats(
      {
        mean: firstRender.actualDuration,
        stdDev: firstRender.stdDev,
        outliers: firstRender.outliers,
      },
      {
        mean: secondRender.actualDuration,
        stdDev: secondRender.stdDev,
        outliers: secondRender.outliers,
      },
      first.iterations,
      second.iterations,
    );
    return {
      id: firstRender.id,
      phase: firstRender.phase,
      startTime:
        (firstRender.startTime * first.iterations + secondRender.startTime * second.iterations) /
        (first.iterations + second.iterations),
      actualDuration: duration.mean,
      stdDev: duration.stdDev,
      outliers: duration.outliers,
    };
  });

  const firstMetricNames = Object.keys(first.metrics).sort();
  const secondMetricNames = Object.keys(second.metrics).sort();
  assert(
    sameJson(firstMetricNames, secondMetricNames),
    `${name} produced different named metrics between runs.`,
  );
  const metrics = Object.fromEntries(
    firstMetricNames.map((metricName) => [
      metricName,
      combineStats(
        first.metrics[metricName],
        second.metrics[metricName],
        first.iterations,
        second.iterations,
      ),
    ]),
  );

  return {
    iterations: first.iterations + second.iterations,
    totalDuration: renders.reduce((total, render) => total + render.actualDuration, 0),
    renders,
    metrics,
  };
}

export function aggregateReports(
  first: BenchmarkReport,
  second: BenchmarkReport,
  base?: BenchmarkReport,
): BenchmarkReport {
  validateCompatibleMetadata(first, second);
  const firstNames = Object.keys(first.report).sort();
  const secondNames = Object.keys(second.report).sort();
  assert(sameJson(firstNames, secondNames), 'The benchmark suite changed between repeated runs.');

  return {
    ...withoutBase(first),
    timestamp: Date.now(),
    report: Object.fromEntries(
      firstNames.map((name) => [name, combineEntry(name, first.report[name], second.report[name])]),
    ),
    ...(base ? { base: withoutBase(base) } : {}),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [outputPath, firstPath, secondPath, basePath] = process.argv.slice(2);
  assert(
    outputPath && firstPath && secondPath,
    'Usage: node aggregateBenchmarks.mts <output> <first> <second> [base]',
  );

  const combined = aggregateReports(
    readReport(firstPath),
    readReport(secondPath),
    basePath ? readReport(basePath) : undefined,
  );
  fs.writeFileSync(outputPath, `${JSON.stringify(combined, null, 2)}\n`);
}
