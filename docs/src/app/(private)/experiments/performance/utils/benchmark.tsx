'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { Field } from '@base-ui/react/field';
import styles from '../performance.module.css';

const DOM_SETTLE_QUIET_WINDOW_MS = 32;
const WARMUP_ITERATIONS = 5;

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
  const { variants } = props;

  const [activeKey, setActiveKey] = React.useState(variants[0].key);
  const [generation, setGeneration] = React.useState(0);
  const [showVariant, setShowVariant] = React.useState(true);
  const [results, setResults] = React.useState<Record<string, VariantResults>>(() =>
    makeInitialResults(variants),
  );
  const [removeOutliersEnabled, setRemoveOutliersEnabled] = React.useState(true);
  const [isBusy, setIsBusy] = React.useState(false);

  const benchmarkRootRef = React.useRef<HTMLDivElement>(null);
  const isBusyRef = React.useRef(false);
  const settleTimeout = useTimeout();

  const activeVariant = variants.find((variant) => variant.key === activeKey) ?? variants[0];

  const measureDomSettled = useStableCallback(() => {
    const start = performance.now();
    let lastMutationAt = start;
    let observer: MutationObserver | null = null;
    let resolved = false;

    return new Promise<number>((resolve) => {
      const finish = () => {
        if (resolved) {
          return;
        }
        resolved = true;
        observer?.disconnect();
        settleTimeout.clear();
        resolve(Math.max(0, lastMutationAt - start));
      };

      const root = benchmarkRootRef.current;

      if (root) {
        observer = new MutationObserver(() => {
          lastMutationAt = performance.now();
          settleTimeout.start(DOM_SETTLE_QUIET_WINDOW_MS, finish);
        });
        observer.observe(root, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
        settleTimeout.start(DOM_SETTLE_QUIET_WINDOW_MS, finish);
      } else {
        finish();
      }

      ReactDOM.flushSync(() => {
        setShowVariant(true);
      });
    });
  });

  const measureCurrentVariant = useStableCallback(() => {
    ReactDOM.flushSync(() => {
      setShowVariant(false);
      setGeneration((value) => value + 1);
    });
    return measureDomSettled();
  });

  const beginBusy = useStableCallback(() => {
    if (isBusyRef.current) {
      return false;
    }
    isBusyRef.current = true;
    setIsBusy(true);
    return true;
  });

  const endBusy = useStableCallback(() => {
    isBusyRef.current = false;
    setIsBusy(false);
  });

  const handleVariantChange = useStableCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!beginBusy()) {
        return;
      }
      try {
        const nextKey = event.target.value;
        ReactDOM.flushSync(() => {
          setShowVariant(false);
          setActiveKey(nextKey);
          setGeneration((value) => value + 1);
        });
        const duration = await measureDomSettled();
        setResults((prev) => ({
          ...prev,
          [nextKey]: { ...prev[nextKey], lastMs: duration },
        }));
      } finally {
        endBusy();
      }
    },
  );

  const handleReRender = useStableCallback(async () => {
    if (!beginBusy()) {
      return;
    }
    try {
      const duration = await measureCurrentVariant();
      setResults((prev) => ({
        ...prev,
        [activeKey]: { ...prev[activeKey], lastMs: duration },
      }));
    } finally {
      endBusy();
    }
  });

  const runBenchmark = useStableCallback(async (iterations: number) => {
    if (!beginBusy()) {
      return;
    }
    const variantKey = activeKey;
    const variantLabel = activeVariant.label;
    console.log(
      `Benchmark "${variantLabel}": ${iterations} iterations (+${WARMUP_ITERATIONS} warmup)...`,
    );
    try {
      const samples: number[] = [];
      for (let i = 0; i < WARMUP_ITERATIONS + iterations; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const duration = await measureCurrentVariant();
        if (i < WARMUP_ITERATIONS) {
          continue;
        }
        samples.push(Math.round(duration * 10) / 10);
      }
      console.log(`Raw samples for "${variantLabel}":`, samples);
      setResults((prev) => ({
        ...prev,
        [variantKey]: {
          lastMs: samples[samples.length - 1] ?? prev[variantKey].lastMs,
          rawSamples: [...prev[variantKey].rawSamples, ...samples],
        },
      }));
    } finally {
      endBusy();
    }
  });

  const handleReset = useStableCallback(() => {
    if (isBusyRef.current) {
      return;
    }
    setResults(makeInitialResults(variants));
  });

  return (
    <div className={styles.HarnessRoot}>
      <div className={styles.Toolbar}>
        <Field.Root className={styles.Field}>
          <Field.Label className={styles.Label}>Variant</Field.Label>
          <select
            value={activeKey}
            onChange={handleVariantChange}
            disabled={isBusy}
            className={styles.Input}
          >
            {variants.map((variant) => (
              <option key={variant.key} value={variant.key}>
                {variant.label}
              </option>
            ))}
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
            const isActive = variant.key === activeKey;
            return (
              <tr key={variant.key} data-active={isActive ? '' : undefined}>
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

      <div ref={benchmarkRootRef} className={styles.VariantArea}>
        {showVariant ? (
          <React.Fragment key={`${activeKey}:${generation}`}>
            {activeVariant.render()}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  );
}
