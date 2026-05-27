'use client';
import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { Tooltip as BaseOldTooltip } from '@base-ui-components/react-before-detached/tooltip';
import { Tooltip as RadixTooltip } from 'radix-ui';
import PerformanceBenchmark, { BenchmarkVariant } from './utils/benchmark';
import styles from './performance.module.css';

const COUNT = 2000;
const indexes = Array.from({ length: COUNT }, (_, i) => i);

const detachedHandle = BaseTooltip.createHandle<number>();

function PlainButtons() {
  return (
    <div className={styles.TooltipPanel}>
      {indexes.map((i) => (
        <button key={i} type="button" className={styles.TooltipButton}>
          Button {i}
        </button>
      ))}
    </div>
  );
}

function BaseUITooltips() {
  return (
    <BaseTooltip.Provider>
      <div className={styles.TooltipPanel}>
        {indexes.map((i) => (
          <BaseTooltip.Root key={i}>
            <BaseTooltip.Trigger className={styles.TooltipButton}>Button {i}</BaseTooltip.Trigger>
            <BaseTooltip.Portal>
              <BaseTooltip.Positioner sideOffset={10}>
                <BaseTooltip.Popup className={styles.TooltipPopup}>
                  <BaseTooltip.Arrow className={styles.Arrow} />
                  {`Bold Item ${i + 1}`}
                </BaseTooltip.Popup>
              </BaseTooltip.Positioner>
            </BaseTooltip.Portal>
          </BaseTooltip.Root>
        ))}
      </div>
    </BaseTooltip.Provider>
  );
}

function BaseUIDetachedTooltips() {
  return (
    <BaseTooltip.Provider>
      <div className={styles.TooltipPanel}>
        {indexes.map((i) => (
          <BaseTooltip.Trigger
            key={i}
            handle={detachedHandle}
            payload={i}
            className={styles.TooltipButton}
          >
            Button {i}
          </BaseTooltip.Trigger>
        ))}
      </div>
      <BaseTooltip.Root handle={detachedHandle}>
        {({ payload }) => (
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner sideOffset={10}>
              <BaseTooltip.Popup className={styles.TooltipPopup}>
                <BaseTooltip.Arrow className={styles.Arrow} />
                <span>{payload !== undefined && `Bold Item ${payload + 1}`}</span>
              </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        )}
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

function BaseUIOldTooltips() {
  return (
    <BaseOldTooltip.Provider>
      <div className={styles.TooltipPanel}>
        {indexes.map((i) => (
          <BaseOldTooltip.Root key={i}>
            <BaseOldTooltip.Trigger className={styles.TooltipButton}>
              Button {i}
            </BaseOldTooltip.Trigger>
            <BaseOldTooltip.Portal>
              <BaseOldTooltip.Positioner sideOffset={10}>
                <BaseOldTooltip.Popup className={styles.TooltipPopup}>
                  <BaseOldTooltip.Arrow className={styles.Arrow} />
                  {`Bold Item ${i + 1}`}
                </BaseOldTooltip.Popup>
              </BaseOldTooltip.Positioner>
            </BaseOldTooltip.Portal>
          </BaseOldTooltip.Root>
        ))}
      </div>
    </BaseOldTooltip.Provider>
  );
}

function RadixTooltips() {
  return (
    <RadixTooltip.Provider>
      <div className={styles.TooltipPanel}>
        {indexes.map((i) => (
          <RadixTooltip.Root key={i}>
            <RadixTooltip.Trigger className={styles.TooltipButton}>Button {i}</RadixTooltip.Trigger>
            <RadixTooltip.Portal>
              <RadixTooltip.Content sideOffset={10} className={styles.TooltipPopup}>
                {`Bold Item ${i + 1}`}
                <RadixTooltip.Arrow className={styles.Arrow} />
              </RadixTooltip.Content>
            </RadixTooltip.Portal>
          </RadixTooltip.Root>
        ))}
      </div>
    </RadixTooltip.Provider>
  );
}

const variants: BenchmarkVariant[] = [
  { key: 'plain', label: 'Plain buttons', render: () => <PlainButtons /> },
  { key: 'base', label: 'Base UI', render: () => <BaseUITooltips /> },
  {
    key: 'base-detached',
    label: 'Base UI with detached triggers',
    render: () => <BaseUIDetachedTooltips />,
  },
  {
    key: 'base-old',
    label: 'Base UI before detached triggers',
    render: () => <BaseUIOldTooltips />,
  },
  { key: 'radix', label: 'Radix', render: () => <RadixTooltips /> },
];

export default function TooltipPerfExperiment() {
  return (
    <div className={styles.Container}>
      <h1>Tooltip rendering performance</h1>
      <p>
        Each variant renders {COUNT} tooltip triggers. Use the toolbar to switch variants, re-render
        the active one, or run multiple iterations for statistics.
      </p>
      <PerformanceBenchmark variants={variants} />
    </div>
  );
}
