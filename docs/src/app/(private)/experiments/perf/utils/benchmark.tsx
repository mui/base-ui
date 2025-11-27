'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';

const DOM_SETTLE_QUIET_WINDOW_MS = 32;

const Controls = React.memo(function Controls(props: {
  setShowBenchmark: React.Dispatch<React.SetStateAction<boolean>>;
  benchmarkRootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { setShowBenchmark, benchmarkRootRef } = props;
  const settleTimeout = useTimeout();
  const [isRunning, setIsRunning] = React.useState(false);

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

        // Resolve once the DOM stays quiet for a small window after the last mutation.
        settleTimeout.start(DOM_SETTLE_QUIET_WINDOW_MS, finish);
      } else {
        finish();
      }

      ReactDOM.flushSync(() => {
        setShowBenchmark(true);
      });
    });
  });

  const runBenchmark = useStableCallback(async (iterations: number, warmupIterations: number) => {
    if (isRunning) {
      console.warn('Benchmark is already running.');
      return;
    }

    setIsRunning(true);
    console.log(`Running benchmark: ${iterations} iterations (+${warmupIterations} warmup)...`);
    try {
      const results = [] as number[];

      for (let i = 0; i < warmupIterations + iterations; i += 1) {
        ReactDOM.flushSync(() => {
          setShowBenchmark(false);
        });

        // eslint-disable-next-line no-await-in-loop
        const domSettleDuration = await measureDomSettled();

        if (i < warmupIterations) {
          continue;
        }

        results.push(Math.round(domSettleDuration * 10) / 10);
      }

      const average = results.reduce((a, b) => a + b, 0) / results.length;
      const stdDev = (() => {
        const squareDiffs = results.map((value) => {
          const diff = value - average;
          return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return +Math.sqrt(avgSquareDiff).toFixed(2);
      })();

      console.log('DOM settled durations (ms):', results);
      console.log('Average:', Math.round(average * 10) / 10);
      console.log('Std Dev:', stdDev);
    } finally {
      setIsRunning(false);
    }
  });

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setShowBenchmark((prev: boolean) => !prev)}
        disabled={isRunning}
      >
        Toggle
      </button>
      <button type="button" onClick={() => runBenchmark(10, 5)} disabled={isRunning}>
        Run 10
      </button>
      <button type="button" onClick={() => runBenchmark(20, 5)} disabled={isRunning}>
        Run 20
      </button>
      <button type="button" onClick={() => runBenchmark(50, 5)} disabled={isRunning}>
        Run 50
      </button>
    </div>
  );
});

export default function PerformanceBenchmark(props: React.PropsWithChildren<{}>) {
  const [showBenchmark, setShowBenchmark] = React.useState(false);
  const benchmarkRootRef = React.useRef<HTMLDivElement>(null);

  return (
    <div>
      <Controls setShowBenchmark={setShowBenchmark} benchmarkRootRef={benchmarkRootRef} />
      <div ref={benchmarkRootRef}>{showBenchmark && props.children}</div>
    </div>
  );
}
