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

/** Opens the `Opener` below from outside, the way a page would through a popup handle. */
const opener: { open?: () => void } = {};

function Opener() {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    opener.open = () => setIsOpen(true);
    return () => {
      opener.open = undefined;
    };
  }, []);
  return <div>{isOpen ? 'Opened' : 'Closed'}</div>;
}

function cells(label = 'First') {
  return within(screen.getByRole('row', { name: new RegExp(`^${label} `) })).getAllByRole('cell');
}

function selectVariant(name: string) {
  const select = screen.getByRole('combobox', { name: 'Variant' });
  const option = within(select).getByRole('option', { name }) as HTMLOptionElement;
  fireEvent.change(select, { target: { value: option.value } });
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

  it('discards a pending Re-render when the workload changes', async () => {
    const { rerender } = await render(<PerformanceBenchmark variants={variants} workloadKey="A" />);

    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    await advanceTime(10);
    rerender(<PerformanceBenchmark variants={variants} workloadKey="B" />);
    await advanceTime(100);

    expect(cells()[1].textContent).toBe('—');
    expect(screen.getByRole('button', { name: 'Re-render' })).toHaveProperty('disabled', false);
  });

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

  it('renders no variant until a measurement starts', async () => {
    await render(<PerformanceBenchmark variants={variants} />);

    expect(screen.queryByText('First workload')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    await advanceTime(100);

    expect(screen.getByText('First workload')).not.toBe(null);
    expect(cells()[1].textContent).not.toBe('—');
  });

  it('unmounts the rendered variant on selection without measuring the new one', async () => {
    await render(<PerformanceBenchmark variants={variants} />);
    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    await advanceTime(100);

    selectVariant('Second');
    await advanceTime(100);

    expect(screen.queryByText('First workload')).toBe(null);
    expect(screen.queryByText('Second workload')).toBe(null);
    expect(cells('Second')[1].textContent).toBe('—');
    expect(screen.getByRole('row', { name: /^Second / }).hasAttribute('data-active')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    await advanceTime(100);

    expect(screen.getByText('Second workload')).not.toBe(null);
    expect(cells('Second')[1].textContent).not.toBe('—');
  });

  it('replaces the controls with the run status while measuring', async () => {
    await render(<PerformanceBenchmark variants={variants} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run 10' }));

    expect(screen.getByRole('status').textContent).toBe('Running First 10 times');
    expect(screen.queryByRole('button', { name: 'Run 10' })).toBe(null);
    expect(screen.queryByRole('combobox', { name: 'Variant' })).toBe(null);

    await advanceTime(1000);

    expect(screen.queryByRole('status')).toBe(null);
    expect(screen.getByRole('button', { name: 'Run 10' })).not.toBe(null);
  });

  it('runs a batch for every variant in sequence when "All variants" is selected', async () => {
    await render(<PerformanceBenchmark variants={variants} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Remove outliers' }));
    selectVariant('All variants');
    fireEvent.click(screen.getByRole('button', { name: 'Run 10' }));
    expect(screen.getByRole('status').textContent).toBe('Running First 10 times');
    // Each variant takes 15 iterations of one 32 ms quiet window, so the second one is running.
    await advanceTime(600);
    expect(screen.getByRole('status').textContent).toBe('Running Second 10 times');
    await advanceTime(1400);

    expect(cells()[2].textContent).toBe('10');
    expect(cells('Second')[2].textContent).toBe('10');
    expect(screen.getByRole('button', { name: 'Run 10' })).toHaveProperty('disabled', false);
  });

  it('re-renders every variant once when "All variants" is selected', async () => {
    await render(<PerformanceBenchmark variants={variants} />);

    selectVariant('All variants');
    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    await advanceTime(200);

    expect(cells()[1].textContent).not.toBe('—');
    expect(cells('Second')[1].textContent).not.toBe('—');
  });

  it('mounts an interaction variant untimed, then times its interaction', async () => {
    const interact = vi.fn(() => opener.open?.());
    await render(
      <PerformanceBenchmark
        variants={[{ key: 'opener', label: 'Opener', render: () => <Opener />, interact }]}
      />,
    );

    // A picker with one variant has nothing to choose from.
    expect(screen.queryByRole('combobox', { name: 'Variant' })).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
    expect(screen.getByText('Closed')).not.toBe(null);
    expect(interact).toHaveBeenCalledTimes(0);

    await advanceTime(100);

    expect(interact).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Opened')).not.toBe(null);
    expect(cells('Opener')[1].textContent).not.toBe('—');

    fireEvent.click(screen.getByRole('button', { name: 'Run 10' }));
    await advanceTime(2000);

    // Five warmup iterations and ten measured ones, each remounting the variant closed first.
    expect(interact).toHaveBeenCalledTimes(16);
    expect(cells('Opener')[2].textContent).toBe('10');
  });
});
