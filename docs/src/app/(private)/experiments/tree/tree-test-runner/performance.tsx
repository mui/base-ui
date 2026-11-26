import * as React from 'react';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useInterval } from '@base-ui/utils/useInterval';
import styles from '../tree-test-runner.module.css';
import type { RunnerStats, TestRunner } from './runner';

interface PerformanceTotals extends RunnerStats {
  /** The measured period, in ms. */
  elapsed: number;
  frames: number;
  slowestFrame: number;
  longTaskTime: number;
  /** Commits of the profiled tree, and their render time in ms. Development builds only. */
  renders: number;
  renderTime: number;
}

interface PerformanceSample {
  lastSecond: PerformanceTotals;
  /** `null` until the first run starts. */
  run: PerformanceTotals | null;
}

/** Whether the browser reports long tasks. Chromium only. */
function supportsLongTasks() {
  return (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes.includes('longtask')
  );
}

/**
 * Measures the main thread for the last second and for the latest run: frame
 * rate, long tasks, and the render time of a `React.Profiler`.
 */
export class PerformanceRecorder {
  private lastSecond = createTotals();

  private run = createTotals();

  private runId = 0;

  private secondStartedAt = performance.now();

  declare private runnerStatsAtSecondStart: RunnerStats;

  private lastFrameAt = 0;

  private readonly frame = AnimationFrame.create();

  constructor(private readonly runner: TestRunner) {
    this.runnerStatsAtSecondStart = { ...runner.stats };
  }

  /** Starts measuring the frames and long tasks. Returns a function that stops it. */
  public start() {
    const onFrame = () => {
      const now = performance.now();
      if (this.lastFrameAt > 0) {
        for (const totals of this.getTotals(now)) {
          totals.frames += 1;
          totals.slowestFrame = Math.max(totals.slowestFrame, now - this.lastFrameAt);
        }
      }
      this.lastFrameAt = now;
      this.frame.request(onFrame);
    };
    this.frame.request(onFrame);

    let observer: PerformanceObserver | null = null;
    if (supportsLongTasks()) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          for (const totals of this.getTotals(entry.startTime, entry.startTime + entry.duration)) {
            totals.longTaskTime += entry.duration;
          }
        }
      });
      observer.observe({ type: 'longtask' });
    }

    return () => {
      this.frame.cancel();
      this.lastFrameAt = 0;
      observer?.disconnect();
    };
  }

  /** The `onRender` callback of the `React.Profiler` around the tree. */
  public recordRender: React.ProfilerOnRenderCallback = (
    _id,
    _phase,
    actualDuration,
    _baseDuration,
    _startTime,
    commitTime,
  ) => {
    for (const totals of this.getTotals(commitTime)) {
      totals.renders += 1;
      totals.renderTime += actualDuration;
    }
  };

  /** Returns the totals since the previous sample, and of the latest run. */
  public sample(): PerformanceSample {
    const now = performance.now();
    const { stats } = this.runner;
    const lastSecond: PerformanceTotals = {
      ...this.lastSecond,
      elapsed: now - this.secondStartedAt,
      results: stats.results - this.runnerStatsAtSecondStart.results,
      updates: stats.updates - this.runnerStatsAtSecondStart.updates,
      handlingTime: stats.handlingTime - this.runnerStatsAtSecondStart.handlingTime,
    };
    this.lastSecond = createTotals();
    this.secondStartedAt = now;
    this.runnerStatsAtSecondStart = { ...stats };

    if (this.runner.runId === 0) {
      return { lastSecond, run: null };
    }
    return {
      lastSecond,
      run: {
        ...this.getRunTotals(),
        ...this.runner.runStats,
        elapsed: (this.runner.runEndedAt ?? now) - this.runner.runStartedAt,
      },
    };
  }

  private getTotals(start: number, end = start) {
    const { runId, runStartedAt, runEndedAt } = this.runner;
    const inRun = runId > 0 && end >= runStartedAt && (runEndedAt == null || start <= runEndedAt);
    return inRun ? [this.lastSecond, this.getRunTotals()] : [this.lastSecond];
  }

  private getRunTotals() {
    if (this.runId !== this.runner.runId) {
      this.runId = this.runner.runId;
      this.run = createTotals();
    }
    return this.run;
  }
}

function createTotals(): PerformanceTotals {
  return {
    elapsed: 0,
    frames: 0,
    slowestFrame: 0,
    longTaskTime: 0,
    renders: 0,
    renderTime: 0,
    results: 0,
    updates: 0,
    handlingTime: 0,
  };
}

const METRICS: { label: string; format: (totals: PerformanceTotals) => string }[] = [
  { label: 'Duration', format: (totals) => `${(totals.elapsed / 1000).toFixed(1)} s` },
  { label: 'Results', format: (totals) => `${perSecond(totals.results, totals)} /s` },
  { label: 'Updates', format: (totals) => `${perSecond(totals.updates, totals)} /s` },
  { label: 'Frame rate', format: (totals) => `${perSecond(totals.frames, totals)} fps` },
  { label: 'Slowest frame', format: (totals) => `${Math.round(totals.slowestFrame)} ms` },
  {
    label: 'Long tasks',
    format: (totals) =>
      supportsLongTasks() ? formatShare(totals.longTaskTime, totals) : 'not reported',
  },
  {
    label: 'Tree render',
    format: (totals) =>
      process.env.NODE_ENV === 'production'
        ? 'not measured'
        : `${formatShare(totals.renderTime, totals)} in ${totals.renders} commits`,
  },
  { label: 'Update handling', format: (totals) => formatShare(totals.handlingTime, totals) },
];

export function PerformancePanel(props: { recorder: PerformanceRecorder }) {
  const { recorder } = props;
  const [sample, setSample] = React.useState<PerformanceSample | null>(null);
  const interval = useInterval();

  React.useEffect(() => {
    interval.start(1000, () => setSample(recorder.sample()));
    return interval.clear;
  }, [interval, recorder]);

  return (
    <section className={styles.Performance} aria-labelledby="performance-title">
      <h2 id="performance-title" className={styles.PerformanceTitle}>
        Performance
      </h2>
      <table className={styles.Metrics}>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Last second</th>
            <th scope="col">Latest run</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => (
            <tr key={metric.label}>
              <th scope="row">{metric.label}</th>
              <td>{sample == null ? '–' : metric.format(sample.lastSecond)}</td>
              <td>{sample?.run == null ? '–' : metric.format(sample.run)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function perSecond(count: number, totals: PerformanceTotals) {
  return totals.elapsed > 0 ? Math.round((count * 1000) / totals.elapsed) : 0;
}

/** A time spent during the period, with its share of the period. */
function formatShare(time: number, totals: PerformanceTotals) {
  const share = totals.elapsed > 0 ? Math.round((time / totals.elapsed) * 100) : 0;
  return `${Math.round(time)} ms (${share}%)`;
}
