import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Checkbox } from '@base-ui/react/checkbox';
import { Popover } from '@base-ui/react/popover';
import { benchmark, ScalarMetric } from '@mui/internal-benchmark';
import { cdp } from 'vitest/browser';
import type { CDPSession } from '@vitest/browser-playwright';
import { createRows } from './shared';

const completeDuration = new ScalarMetric({
  name: 'complete_duration',
  format: { style: 'unit', unit: 'millisecond' },
});

const scriptDuration = new ScalarMetric({
  name: 'script_duration',
  format: { style: 'unit', unit: 'millisecond' },
});

const STYLES = `
@keyframes exit-bench-spin { to { transform: rotate(1turn); } }
.exit-bench-indicator { display: inline-block; width: 8px; height: 8px; }
.exit-bench-transition { transition: opacity 50ms; }
.exit-bench-transition[data-ending-style] { opacity: 0; }
.exit-bench-spinner { animation: exit-bench-spin 1s linear infinite; }
.exit-bench-pseudo::after { content: ''; display: inline-block; animation: exit-bench-spin 1s linear infinite; }
.exit-bench-popup { transition: opacity 50ms; }
.exit-bench-popup[data-ending-style] { opacity: 0; }
`;

let close = () => {};
let resolveCompleted = () => {};
let completed = Promise.resolve();

function resetCompleted() {
  completed = new Promise((resolve) => {
    resolveCompleted = resolve;
  });
}

async function getScriptDuration(session: CDPSession) {
  const { metrics } = await session.send('Performance.getMetrics');
  return metrics.find((metric) => metric.name === 'ScriptDuration')!.value * 1000;
}

/**
 * Closes the rendered case and records the time until every close completion has run, and the
 * main-thread script time spent until then.
 */
async function closeAndMeasure() {
  // Let the mount settle so its work isn't attributed to the close.
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  const session: CDPSession = cdp();
  await session.send('Performance.enable');
  const scriptStart = await getScriptDuration(session);
  const start = performance.now();
  ReactDOM.flushSync(close);
  await completed;
  completeDuration.record(performance.now() - start);
  scriptDuration.record((await getScriptDuration(session)) - scriptStart);
}

function CheckboxIndicators(props: { count: number; className: string }) {
  const { count, className } = props;
  const [checked, setChecked] = React.useState(true);
  const rows = React.useMemo(() => createRows(count, 'Checkbox'), [count]);
  const mountedIndicators = React.useRef(count);

  close = () => setChecked(false);

  const indicatorRef = React.useCallback(() => {
    return () => {
      mountedIndicators.current -= 1;
      if (mountedIndicators.current === 0) {
        resolveCompleted();
      }
    };
  }, []);

  return (
    <div>
      <style>{STYLES}</style>
      {rows.map((row) => (
        <Checkbox.Root key={row.id} aria-label={row.label} checked={checked}>
          <Checkbox.Indicator ref={indicatorRef} className={`exit-bench-indicator ${className}`} />
        </Checkbox.Root>
      ))}
    </div>
  );
}

function PopoverAmongAnimations(props: { animations: number }) {
  const { animations } = props;
  const [open, setOpen] = React.useState(true);
  const rows = React.useMemo(() => createRows(animations, 'Spinner'), [animations]);

  close = () => setOpen(false);

  return (
    <div>
      <style>{STYLES}</style>
      {rows.map((row) => (
        <span key={row.id} className="exit-bench-indicator exit-bench-spinner" />
      ))}
      <Popover.Root
        open={open}
        onOpenChangeComplete={(nextOpen) => {
          if (!nextOpen) {
            resolveCompleted();
          }
        }}
      >
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup className="exit-bench-popup">Popover content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

const checkboxCases = [
  { label: 'exit transition on the indicator', className: 'exit-bench-transition' },
  { label: 'infinite animation on the indicator', className: 'exit-bench-spinner' },
  { label: 'infinite animation on ::after', className: 'exit-bench-pseudo' },
  { label: 'no animation', className: '' },
];

checkboxCases.forEach(({ label, className }) => {
  benchmark(
    `Checkbox.Indicator exit (500 instances), ${label}`,
    () => {
      resetCompleted();
      return <CheckboxIndicators count={500} className={className} />;
    },
    closeAndMeasure,
  );
});

[0, 2000].forEach((animations) => {
  benchmark(
    `Popover exit among ${animations} running animations`,
    () => {
      resetCompleted();
      return <PopoverAmongAnimations animations={animations} />;
    },
    closeAndMeasure,
  );
});
