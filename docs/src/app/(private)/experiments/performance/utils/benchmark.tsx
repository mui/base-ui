'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { closest, contains } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { Field } from '@base-ui/react/field';
import styles from '../performance.module.css';

const DOM_SETTLE_QUIET_WINDOW_MS = 32;
const WARMUP_ITERATIONS = 5;
/** Stops a measurement if something on the page never goes quiet. */
const MAX_MEASUREMENT_MS = 10000;
/** Select value that runs every variant in sequence, so no variant may use it as its key. */
const ALL_VARIANTS = '__all__';

export interface BenchmarkVariant {
  key: string;
  label: string;
  render: () => React.ReactNode;
}

interface VariantResults {
  lastMs: number | null;
  rawSamples: number[];
}

interface PerformanceBenchmarkProps {
  variants: BenchmarkVariant[];
  /**
   * Identifies the workload the variants render. Results reset when it changes, and a running
   * batch is discarded, because samples taken under different workloads are not comparable.
   */
  workloadKey?: string;
}

function makeInitialResults(variants: BenchmarkVariant[]): Record<string, VariantResults> {
  const init: Record<string, VariantResults> = {};
  for (const variant of variants) {
    init[variant.key] = { lastMs: null, rawSamples: [] };
  }
  return init;
}

function computeStats(samples: number[]) {
  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = sum / samples.length;
  const variance = samples.reduce((a, b) => a + (b - avg) ** 2, 0) / samples.length;
  return {
    avg,
    stdDev: Math.sqrt(variance),
    min: Math.min(...samples),
    max: Math.max(...samples),
    sampleCount: samples.length,
  };
}

export function removeOutliers(data: number[]) {
  if (data.length < 4) {
    return data;
  }
  const sorted = data.slice().sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.floor((sorted.length * 3) / 4)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return data.filter((value) => value >= lower && value <= upper);
}

export function logResults(results: number[]) {
  if (results.length === 0) {
    console.log('No samples.');
    return;
  }
  console.log(results);
  const stats = computeStats(results);
  console.log('Average:', Math.round(stats.avg * 10) / 10);
  console.log('Std Dev:', Math.round(stats.stdDev * 100) / 100);
}

export default function PerformanceBenchmark(props: PerformanceBenchmarkProps) {
  const { variants, workloadKey } = props;

  /** What the select shows: a variant key, or `ALL_VARIANTS`. */
  const [selectedKey, setSelectedKey] = React.useState(variants[0].key);
  /** The variant rendered in the benchmark area. Differs from `selectedKey` while "All" is selected. */
  const [mountedKey, setMountedKey] = React.useState(variants[0].key);
  const [generation, setGeneration] = React.useState(0);
  const [showVariant, setShowVariant] = React.useState(true);
  const [results, setResults] = React.useState<Record<string, VariantResults>>(() =>
    makeInitialResults(variants),
  );
  const [removeOutliersEnabled, setRemoveOutliersEnabled] = React.useState(true);
  const [isBusy, setIsBusy] = React.useState(false);
  const [measurementError, setMeasurementError] = React.useState<string | null>(null);

  const benchmarkRootRef = React.useRef<HTMLDivElement>(null);
  const chromeRef = React.useRef<HTMLDivElement>(null);
  const isBusyRef = React.useRef(false);
  const previousWorkloadKey = React.useRef(workloadKey);
  const workloadRevisionRef = React.useRef(0);
  const activeMeasurementRef = React.useRef<(() => void) | null>(null);
  const isUnmountedRef = React.useRef(false);
  const settleTimeout = useTimeout();
  const maxDurationTimeout = useTimeout();

  /**
   * `useTimeout` clears its timer on unmount, so a measurement that is waiting for the quiet
   * window would never call `finish`. The observer would stay connected to a detached tree and the
   * promise would never settle. Settle it here instead.
   */
  React.useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      activeMeasurementRef.current?.();
    };
  }, []);

  useIsoLayoutEffect(() => {
    if (previousWorkloadKey.current !== workloadKey) {
      previousWorkloadKey.current = workloadKey;
      workloadRevisionRef.current += 1;
      activeMeasurementRef.current?.();
      setResults(makeInitialResults(variants));
      setMeasurementError(null);
    }
  }, [workloadKey, variants]);

  const isCurrentWorkload = useStableCallback(
    (revision: number) => !isUnmountedRef.current && workloadRevisionRef.current === revision,
  );

  const mountedVariant = variants.find((variant) => variant.key === mountedKey) ?? variants[0];
  const keysToRun =
    selectedKey === ALL_VARIANTS ? variants.map((variant) => variant.key) : [selectedKey];

  /**
   * Variants portal their popups to `document.body`, so the whole document is observed. Mutations
   * from the harness controls and the dev overlay are ignored; they are not part of the workload.
   */
  const isMeasurableMutation = useStableCallback((record: MutationRecord) => {
    const target = record.target;
    const node = target.nodeType === Node.ELEMENT_NODE ? (target as Element) : target.parentElement;
    if (!node) {
      return false;
    }
    if (contains(chromeRef.current, node)) {
      return false;
    }
    return (
      closest(node, 'nextjs-portal, [data-nextjs-dialog-overlay], #__next-build-watcher') == null
    );
  });

  const measureDomSettled = useStableCallback(() => {
    const start = performance.now();
    let lastMutationAt = start;
    let observer: MutationObserver | null = null;
    let resolved = false;

    return new Promise<number | null>((resolve) => {
      const finish = (duration: number | null) => {
        if (resolved) {
          return;
        }
        resolved = true;
        activeMeasurementRef.current = null;
        observer?.disconnect();
        settleTimeout.clear();
        maxDurationTimeout.clear();
        resolve(duration);
      };

      const finishSettled = () => finish(Math.max(0, lastMutationAt - start));

      // Cancellation is not a sample, whether caused by unmounting or a workload change.
      activeMeasurementRef.current = () => finish(null);

      const root = benchmarkRootRef.current;
      const doc = root ? ownerDocument(root) : null;

      if (root && doc?.body) {
        observer = new MutationObserver((records) => {
          if (!records.some(isMeasurableMutation)) {
            return;
          }
          lastMutationAt = performance.now();
          settleTimeout.start(DOM_SETTLE_QUIET_WINDOW_MS, finishSettled);
        });
        observer.observe(doc.body, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
        settleTimeout.start(DOM_SETTLE_QUIET_WINDOW_MS, finishSettled);
        maxDurationTimeout.start(MAX_MEASUREMENT_MS, () => {
          setMeasurementError(
            `Measurement stopped because the page did not settle within ${MAX_MEASUREMENT_MS / 1000} seconds. No results were recorded for this run.`,
          );
          finish(null);
        });
      } else {
        finish(null);
      }

      ReactDOM.flushSync(() => {
        setShowVariant(true);
      });
    });
  });

  /** Unmounts the rendered variant, mounts `key`, and resolves with the time its DOM took to settle. */
  const measureVariant = useStableCallback((key: string) => {
    ReactDOM.flushSync(() => {
      setShowVariant(false);
      setMountedKey(key);
      setGeneration((value) => value + 1);
    });
    return measureDomSettled();
  });

  const recordLast = useStableCallback((key: string, duration: number) => {
    setResults((prev) => ({
      ...prev,
      [key]: { ...prev[key], lastMs: duration },
    }));
  });

  const beginBusy = useStableCallback(() => {
    if (isBusyRef.current) {
      return false;
    }
    isBusyRef.current = true;
    setIsBusy(true);
    setMeasurementError(null);
    return true;
  });

  const endBusy = useStableCallback(() => {
    isBusyRef.current = false;
    setIsBusy(false);
  });

  const handleVariantChange = useStableCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextKey = event.target.value;
      if (nextKey === ALL_VARIANTS) {
        // Nothing changes on screen until the next action, which then covers every variant.
        setSelectedKey(nextKey);
        return;
      }
      if (!beginBusy()) {
        return;
      }
      const workloadRevision = workloadRevisionRef.current;
      try {
        setSelectedKey(nextKey);
        const duration = await measureVariant(nextKey);
        if (duration === null || !isCurrentWorkload(workloadRevision)) {
          return;
        }
        recordLast(nextKey, duration);
      } finally {
        endBusy();
      }
    },
  );

  const handleReRender = useStableCallback(async () => {
    if (!beginBusy()) {
      return;
    }
    const workloadRevision = workloadRevisionRef.current;
    try {
      for (const key of keysToRun) {
        // eslint-disable-next-line no-await-in-loop
        const duration = await measureVariant(key);
        if (duration === null || !isCurrentWorkload(workloadRevision)) {
          return;
        }
        recordLast(key, duration);
      }
    } finally {
      endBusy();
    }
  });

  /**
   * Measures `key` for the warmup rounds and then `iterations` more. Resolves with the samples, or
   * with `null` when the run was cancelled or timed out, in which case nothing should be recorded.
   */
  const collectSamples = useStableCallback(
    async (key: string, iterations: number, workloadRevision: number) => {
      const label = variants.find((variant) => variant.key === key)?.label ?? key;
      console.log(
        `Benchmark "${label}": ${iterations} iterations (+${WARMUP_ITERATIONS} warmup)...`,
      );
      const samples: number[] = [];
      for (let i = 0; i < WARMUP_ITERATIONS + iterations; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const duration = await measureVariant(key);
        if (isUnmountedRef.current) {
          return null;
        }
        if (!isCurrentWorkload(workloadRevision)) {
          console.warn(`Benchmark "${label}" discarded: the workload changed during the run.`);
          return null;
        }
        if (duration === null) {
          return null;
        }
        if (i < WARMUP_ITERATIONS) {
          continue;
        }
        samples.push(Math.round(duration * 10) / 10);
      }
      console.log(`Raw samples for "${label}":`, samples);
      return samples;
    },
  );

  const runBenchmark = useStableCallback(async (iterations: number) => {
    if (!beginBusy()) {
      return;
    }
    const workloadRevision = workloadRevisionRef.current;
    try {
      for (const key of keysToRun) {
        // eslint-disable-next-line no-await-in-loop
        const samples = await collectSamples(key, iterations, workloadRevision);
        if (samples === null) {
          return;
        }
        setResults((prev) => ({
          ...prev,
          [key]: {
            lastMs: samples[samples.length - 1] ?? prev[key].lastMs,
            rawSamples: [...prev[key].rawSamples, ...samples],
          },
        }));
      }
    } finally {
      endBusy();
    }
  });

  const handleReset = useStableCallback(() => {
    if (isBusyRef.current) {
      return;
    }
    setResults(makeInitialResults(variants));
    setMeasurementError(null);
  });

  const variantSelectId = React.useId();

  /**
   * Keeps the element identity stable so that statistics-only updates, such as the outlier
   * toggle, do not rerender the benchmark content. Measurements remount it through `generation`.
   */
  const variantContent = React.useMemo(
    () => (
      <React.Fragment key={`${mountedKey}:${generation}`}>{mountedVariant.render()}</React.Fragment>
    ),
    [mountedVariant, mountedKey, generation],
  );

  return (
    <div className={styles.HarnessRoot}>
      <div ref={chromeRef} className={styles.Chrome}>
        <div className={styles.Toolbar}>
          <Field.Root className={styles.VariantField}>
            <Field.Label className={styles.Label} htmlFor={variantSelectId}>
              Variant
            </Field.Label>
            <select
              id={variantSelectId}
              value={selectedKey}
              onChange={handleVariantChange}
              disabled={isBusy}
              className={styles.VariantSelect}
            >
              {variants.map((variant) => (
                <option key={variant.key} value={variant.key}>
                  {variant.label}
                </option>
              ))}
              <option value={ALL_VARIANTS}>All variants</option>
            </select>
          </Field.Root>
          <div className={styles.ToolbarActions}>
            <button
              type="button"
              onClick={handleReRender}
              disabled={isBusy}
              className={styles.ToolbarButton}
            >
              Re-render
            </button>
            <button
              type="button"
              onClick={() => runBenchmark(10)}
              disabled={isBusy}
              className={styles.ToolbarButton}
            >
              Run 10
            </button>
            <button
              type="button"
              onClick={() => runBenchmark(20)}
              disabled={isBusy}
              className={styles.ToolbarButton}
            >
              Run 20
            </button>
            <button
              type="button"
              onClick={() => runBenchmark(50)}
              disabled={isBusy}
              className={styles.ToolbarButton}
            >
              Run 50
            </button>
          </div>
          <div className={styles.ToolbarOptions}>
            <label className={styles.ToolbarCheckbox}>
              <input
                type="checkbox"
                checked={removeOutliersEnabled}
                onChange={(event) => setRemoveOutliersEnabled(event.target.checked)}
                disabled={isBusy}
              />
              Remove outliers
            </label>
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className={styles.ToolbarButton}
            >
              Reset
            </button>
          </div>
        </div>

        {measurementError && <p role="status">{measurementError}</p>}

        <table className={styles.Table}>
          <thead className={styles.TableHeader}>
            <tr>
              <th>Variant</th>
              <th>Last (ms)</th>
              <th>Samples</th>
              <th>Avg (ms)</th>
              <th>Std dev</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody className={styles.TableBody}>
            {variants.map((variant) => {
              const variantResults = results[variant.key];
              const samplesForStats = removeOutliersEnabled
                ? removeOutliers(variantResults.rawSamples)
                : variantResults.rawSamples;
              const stats = samplesForStats.length > 0 ? computeStats(samplesForStats) : null;
              const isMounted = variant.key === mountedKey;
              return (
                <tr key={variant.key} data-active={isMounted ? '' : undefined}>
                  <td>{variant.label}</td>
                  <td>{variantResults.lastMs != null ? variantResults.lastMs.toFixed(1) : '—'}</td>
                  <td>{stats ? stats.sampleCount : '—'}</td>
                  <td>{stats ? stats.avg.toFixed(1) : '—'}</td>
                  <td>{stats ? stats.stdDev.toFixed(2) : '—'}</td>
                  <td>{stats ? stats.min.toFixed(1) : '—'}</td>
                  <td>{stats ? stats.max.toFixed(1) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div ref={benchmarkRootRef} className={styles.VariantArea}>
        {showVariant ? variantContent : null}
      </div>
    </div>
  );
}
