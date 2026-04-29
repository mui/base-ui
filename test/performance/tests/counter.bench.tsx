import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';

function simulateSlowdown(ms: number) {
  const jitter = ms * 0.1 * (2 * Math.random() - 1);
  const end = performance.now() + ms + jitter;
  while (performance.now() < end) {
    // burn CPU
  }
}

function Counter() {
  const [count, setCount] = React.useState(0);
  simulateSlowdown(2);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      {count}
    </button>
  );
}

benchmark(
  'Counter click',
  () => <Counter />,
  async () => {
    document.querySelector('button')?.click();
  },
);
