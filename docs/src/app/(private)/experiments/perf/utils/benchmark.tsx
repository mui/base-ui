'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const Controls = React.memo(function Controls(props: {
  setShowBenchmark: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { setShowBenchmark } = props;
  const runBenchmark = (iterations = 10, warmupIterations = 5) => {
    const results = [] as number[];

    for (let i = 0; i < warmupIterations + iterations; i += 1) {
      ReactDOM.flushSync(() => {
        setShowBenchmark(false);
      });
      const start = performance.now();
      ReactDOM.flushSync(() => {
        setShowBenchmark(true);
      });
      if (i < warmupIterations) {
        continue;
      }
      const end = performance.now();
      const elapsed = end - start;
      results.push(Math.round(elapsed * 10) / 10);
    }

    console.log(results);
    console.log(
      'Average:',
      Math.round((results.reduce((a, b) => a + b, 0) / results.length) * 10) / 10,
    );
    console.log(
      'Std Dev:',
      (() => {
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const squareDiffs = results.map((value) => {
          const diff = value - avg;
          return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return +Math.sqrt(avgSquareDiff).toFixed(2);
      })(),
    );
  };

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setShowBenchmark((prev: boolean) => !prev)}>
        Toggle
      </button>
      <button type="button" onClick={() => runBenchmark(10, 5)}>
        Run 10
      </button>
      <button type="button" onClick={() => runBenchmark(20, 5)}>
        Run 20
      </button>
      <button type="button" onClick={() => runBenchmark(50, 5)}>
        Run 50
      </button>
    </div>
  );
});

export default function PerformanceBenchmark(props: React.PropsWithChildren<{}>) {
  const [showBenchmark, setShowBenchmark] = React.useState(false);

  return (
    <div>
      <Controls setShowBenchmark={setShowBenchmark} />
      {showBenchmark && props.children}
    </div>
  );
}
