import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateReports, type BenchmarkReport } from './aggregateBenchmarks.mts';

function createReport(
  commitSha: string,
  renderDuration: number,
  paintMean: number,
): BenchmarkReport {
  return {
    version: 1,
    timestamp: 1,
    commitSha,
    repo: 'mui/base-ui',
    reportType: 'benchmark',
    prNumber: 123,
    branch: commitSha === 'a'.repeat(40) ? 'master' : 'feature',
    report: {
      'Menu open': {
        iterations: 20,
        totalDuration: renderDuration,
        renders: [
          {
            id: 'Menu',
            phase: 'update',
            startTime: 0,
            actualDuration: renderDuration,
            stdDev: 1,
            outliers: 0,
          },
        ],
        metrics: {
          'bench:paint#menu-open': {
            mean: paintMean,
            stdDev: 2,
            outliers: 0,
          },
        },
      },
    },
    metricDefinitions: {
      'bench:paint': { kind: 'scalar' },
    },
  };
}

test('combines repeated runs and preserves named paint metrics and the baseline', () => {
  const masterFirst = createReport('a'.repeat(40), 10, 20);
  const masterSecond = createReport('a'.repeat(40), 14, 24);
  const master = aggregateReports(masterFirst, masterSecond);

  const headFirst = createReport('b'.repeat(40), 12, 30);
  const headSecond = createReport('b'.repeat(40), 16, 34);
  const result = aggregateReports(headFirst, headSecond, master);

  assert.equal(result.report['Menu open'].iterations, 40);
  assert.equal(result.report['Menu open'].totalDuration, 14);
  assert.equal(result.report['Menu open'].metrics['bench:paint#menu-open'].mean, 32);
  assert.equal(result.base?.report['Menu open'].totalDuration, 12);
  assert.equal('base' in (result.base ?? {}), false);
});

test('rejects inconsistent benchmark coverage between repeated runs', () => {
  const first = createReport('a'.repeat(40), 10, 20);
  const second = createReport('a'.repeat(40), 10, 20);
  delete second.report['Menu open'];

  assert.throws(
    () => aggregateReports(first, second),
    /benchmark suite changed between repeated runs/i,
  );
});
