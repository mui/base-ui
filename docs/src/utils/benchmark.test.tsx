// @vitest-environment jsdom
// Keep this outside experiments: its route loader dynamically imports every .tsx file there.
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createRenderer, fireEvent, screen, within } from '@mui/internal-test-utils';
import { Timeout } from '@base-ui/utils/useTimeout';
import PerformanceBenchmark, {
  BenchmarkVariant,
} from '../app/(private)/experiments/performance/utils/benchmark';

const variants: BenchmarkVariant[] = [
  { key: 'first', label: 'First', render: () => <div>First workload</div> },
  { key: 'second', label: 'Second', render: () => <div>Second workload</div> },
];

function cells(label = 'First') {
  return within(screen.getByRole('row', { name: new RegExp(`^${label} `) })).getAllByRole('cell');
}

async function advanceTime(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('PerformanceBenchmark', () => {
  const { render } = createRenderer({ strict: false });
  const { render: renderStrict } = createRenderer({ strict: true });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records a full batch after Strict Mode replays effect setup', async () => {
    await renderStrict(<PerformanceBenchmark variants={variants} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Remove outliers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run 10' }));
    await advanceTime(1000);

    expect(cells()[2].textContent).toBe('10');
    expect(screen.getByRole('button', { name: 'Run 10' })).toHaveProperty('disabled', false);
  });

  it.each(['Re-render', 'variant change'])(
    'discards a pending %s when the workload changes',
    async (action) => {
      const { rerender } = await render(
        <PerformanceBenchmark variants={variants} workloadKey="A" />,
      );

      if (action === 'Re-render') {
        fireEvent.click(screen.getByRole('button', { name: action }));
      } else {
        fireEvent.change(screen.getByRole('combobox', { name: 'Variant' }), {
          target: { value: 'second' },
        });
      }
      await advanceTime(10);
      rerender(<PerformanceBenchmark variants={variants} workloadKey="B" />);
      await advanceTime(100);

      expect(cells()[1].textContent).toBe('—');
      expect(cells('Second')[1].textContent).toBe('—');
      expect(screen.getByRole('button', { name: 'Re-render' })).toHaveProperty('disabled', false);
    },
  );

  it('discards a batch even if the workload changes back before its continuation runs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = await render(<PerformanceBenchmark variants={variants} workloadKey="A" />);
    fireEvent.click(screen.getByRole('button', { name: 'Run 10' }));
    // Five warmup iterations have completed, and the first measured iteration is pending.
    await advanceTime(170);

    await act(async () => {
      ReactDOM.flushSync(() => {
        rerender(<PerformanceBenchmark variants={variants} workloadKey="B" />);
      });
      ReactDOM.flushSync(() => {
        rerender(<PerformanceBenchmark variants={variants} workloadKey="A" />);
      });
    });
    await advanceTime(1000);

    expect(cells()[2].textContent).toBe('—');
    expect(warn).toHaveBeenCalledWith(
      'Benchmark "First" discarded: the workload changed during the run.',
    );
    expect(screen.getByRole('button', { name: 'Run 10' })).toHaveProperty('disabled', false);
    warn.mockRestore();
  });

  it.each(['Re-render', 'Run 10'])(
    'aborts %s on timeout without recording a result',
    async (action) => {
      await render(<PerformanceBenchmark variants={variants} />);
      fireEvent.click(screen.getByRole('button', { name: action }));
      // A batch has already collected some samples before the page stops settling.
      if (action === 'Run 10') {
        await advanceTime(200);
      }

      const noise = document.createElement('span');
      document.body.appendChild(noise);
      const mutationTimeout = Timeout.create();
      let mutationCount = 0;
      function mutate() {
        mutationCount += 1;
        noise.textContent = String(mutationCount);
        mutationTimeout.start(16, mutate);
      }
      mutate();

      try {
        await advanceTime(10000);
        expect(screen.getByRole('status').textContent).toContain(
          'did not settle within 10 seconds',
        );
        expect(cells()[1].textContent).toBe('—');
        expect(cells()[2].textContent).toBe('—');
        expect(screen.getByRole('button', { name: action })).toHaveProperty('disabled', false);
      } finally {
        mutationTimeout.clear();
        noise.remove();
      }

      fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
      await advanceTime(100);
      expect(screen.queryByRole('status')).toBe(null);
      expect(cells()[1].textContent).not.toBe('—');
    },
  );
});
