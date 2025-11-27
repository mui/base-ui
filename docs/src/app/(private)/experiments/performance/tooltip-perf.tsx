'use client';
import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';
import { Tooltip as RadixTooltip } from 'radix-ui';
import styles from './tooltip-perf.module.css';

type Mode = 'plain' | 'base' | 'radix';

const modes: Mode[] = ['plain', 'base', 'radix'];

const array = [...new Array(2000).keys()];

/**
 * 2,000 plain buttons (baseline)
 */
function ExamplePlainButtons() {
  const result = array.map((i) => (
    <button key={i} type="button" aria-label="Bold" className={styles.Button}>
      Button {i}
    </button>
  ));

  return <div className={styles.Panel}>{result}</div>;
}

/**
 * 2,000 Base UI tooltips
 */
function ExampleBaseUITooltip() {
  const result = array.map((i) => (
    <BaseTooltip.Root key={i}>
      <BaseTooltip.Trigger aria-label="Bold" className={styles.Button}>
        Button {i}
      </BaseTooltip.Trigger>
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={10}>
          <BaseTooltip.Popup className={styles.Popup}>
            <BaseTooltip.Arrow className={styles.Arrow} />
            {`Bold Item ${i + 1}`}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  ));

  return (
    <BaseTooltip.Provider>
      <div className={styles.Panel}>{result}</div>
    </BaseTooltip.Provider>
  );
}

/**
 * 2,000 Radix tooltips
 */
function ExampleRadixTooltip() {
  const result = array.map((i) => (
    <RadixTooltip.Root key={i}>
      <RadixTooltip.Trigger aria-label="Bold" className={styles.Button}>
        Button {i}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content sideOffset={10} className={styles.Popup}>
          {`Bold Item ${i + 1}`}
          <RadixTooltip.Arrow className={styles.Arrow} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  ));

  return (
    <RadixTooltip.Provider>
      <div className={styles.Panel}>{result}</div>
    </RadixTooltip.Provider>
  );
}

let mutationObserver: MutationObserver | null = null;
/**
 * Harness: select a demo and measure ONLY the time it takes to switch modes.
 */
export default function ExampleTooltipPerf() {
  const [mode, setMode] = React.useState<Mode>('plain');
  const demoRef = React.useRef<HTMLDivElement | null>(null);
  const [mutationTimeByMode, setMutationTimeByMode] = React.useState<Record<Mode, number>>({
    plain: 0,
    base: 0,
    radix: 0,
  });
  const modeChangeStartRef = React.useRef<{ mode: Mode; time: DOMHighResTimeStamp } | null>(null);

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as Mode;
    modeChangeStartRef.current = { mode: nextMode, time: performance.now() };
    setMode(nextMode);
  };

  React.useLayoutEffect(() => {
    mutationObserver = new MutationObserver(() => {
      if (modeChangeStartRef.current != null) {
        const end = performance.now();
        const modeChange = modeChangeStartRef.current;
        const duration = end - modeChange.time;
        setMutationTimeByMode((prev) => ({
          ...prev,
          [modeChange.mode]: duration,
        }));
        modeChangeStartRef.current = null;
      }
    });
    if (demoRef.current && mutationObserver) {
      mutationObserver.observe(demoRef.current, { subtree: true, childList: true });
    }
    return () => {
      mutationObserver?.disconnect();
    };
  }, []);

  let demo: React.ReactNode = null;
  if (mode === 'plain') {
    demo = <ExamplePlainButtons />;
  } else if (mode === 'base') {
    demo = <ExampleBaseUITooltip />;
  } else {
    demo = <ExampleRadixTooltip />;
  }

  return (
    <div className={styles.Root}>
      <div className={styles.Controls}>
        <label>
          Demo:{' '}
          <select value={mode} onChange={handleModeChange}>
            {modes.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)} {m === 'plain' ? 'buttons' : 'tooltip'}
              </option>
            ))}
          </select>
        </label>
      </div>
      Last mutation time:{' '}
      <table className={styles.Table}>
        <thead className={styles.TableHeader}>
          <tr>
            <th>Mode</th>
            <th>Time (ms)</th>
          </tr>
        </thead>
        <tbody className={styles.TableBody}>
          {modes.map((m) => (
            <tr key={m}>
              <td>{m}</td>
              <td>{mutationTimeByMode[m].toFixed(0)} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>Current mode: {mode}</div>
      <hr />
      <div ref={demoRef}>{demo}</div>
    </div>
  );
}
