'use client';
import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip';
import { Tooltip as RadixTooltip } from 'radix-ui';
import styles from './tooltip-perf.module.css';

type Mode = 'plain' | 'base' | 'radix';

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

/**
 * Harness: select a demo and measure ONLY the time it takes to switch modes.
 */
export default function ExampleTooltipPerf() {
  const [mode, setMode] = React.useState<Mode>('plain');
  const switchLabelRef = React.useRef<string | null>(null);

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as Mode;
    const label = `switch to ${nextMode}`;
    console.log(`=== ${label} ===`);
    console.time(label);
    switchLabelRef.current = label;
    setMode(nextMode);
  };

  // This runs after React has committed the new mode's UI.
  React.useEffect(() => {
    if (switchLabelRef.current) {
      console.timeEnd(switchLabelRef.current);
      switchLabelRef.current = null;
    }
  }, [mode]);

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
            <option value="plain">Plain buttons</option>
            <option value="base">Base UI tooltip</option>
            <option value="radix">Radix tooltip</option>
          </select>
        </label>
      </div>
      {mode}
      {demo}
    </div>
  );
}
