import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';

function HeavyList({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>
          Item {i} — {Math.sqrt(i).toFixed(4)}
        </li>
      ))}
    </ul>
  );
}

benchmark('HeavyList mount', () => <HeavyList count={1000} />, {
  runs: 10,
  warmupRuns: 5,
});
