'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import PerformanceBenchmark, { BenchmarkVariant } from './utils/benchmark';
import styles from './performance.module.css';

const ITEM_COUNT = 1000;
const items = Array.from({ length: ITEM_COUNT }, (_, i) => `Item ${i + 1}`);

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ComboboxActions() {
  return (
    <div className={styles.ComboboxActionButtons}>
      <Combobox.Clear className={styles.ComboboxClear} aria-label="Clear selection">
        <ClearIcon className={styles.ComboboxIcon} />
      </Combobox.Clear>
      <Combobox.Trigger className={styles.ComboboxTrigger} aria-label="Open popup">
        <ChevronDownIcon className={styles.ComboboxIcon} />
      </Combobox.Trigger>
    </div>
  );
}

function ComboboxWithIndex() {
  return (
    <Combobox.Root items={items}>
      <label className={styles.ComboboxLabel}>
        Choose an item
        <Combobox.Input placeholder="e.g. Item 1" className={styles.ComboboxInput} />
        <ComboboxActions />
      </label>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={styles.ComboboxPopup}>
            <Combobox.Empty className={styles.ComboboxEmpty}>No items found.</Combobox.Empty>
            <Combobox.List>
              {(item: string, index: number) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  index={index}
                  className={styles.ComboboxItem}
                >
                  <Combobox.ItemIndicator className={styles.ComboboxItemIndicator}>
                    <CheckIcon className={styles.ComboboxItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ComboboxItemText}>{item}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function ComboboxWithoutIndex() {
  return (
    <Combobox.Root items={items}>
      <label className={styles.ComboboxLabel}>
        Choose an item
        <Combobox.Input placeholder="e.g. Item 1" className={styles.ComboboxInput} />
        <ComboboxActions />
      </label>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={styles.ComboboxPopup}>
            <Combobox.Empty className={styles.ComboboxEmpty}>No items found.</Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={styles.ComboboxItem}>
                  <Combobox.ItemIndicator className={styles.ComboboxItemIndicator}>
                    <CheckIcon className={styles.ComboboxItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ComboboxItemText}>{item}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function ComboboxOpenApi() {
  return (
    <Combobox.Root>
      <label className={styles.ComboboxLabel}>
        Choose an item
        <Combobox.Input placeholder="e.g. Item 1" className={styles.ComboboxInput} />
        <ComboboxActions />
      </label>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.ComboboxPositioner} sideOffset={4}>
          <Combobox.Popup className={styles.ComboboxPopup}>
            <Combobox.List>
              {items.map((item) => (
                <Combobox.Item key={item} value={item} className={styles.ComboboxItem}>
                  <Combobox.ItemIndicator className={styles.ComboboxItemIndicator}>
                    <CheckIcon className={styles.ComboboxItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ComboboxItemText}>{item}</div>
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function PlainInputBaseline() {
  return (
    <div>
      <label className={styles.ComboboxLabel}>
        Choose an item
        <input type="text" placeholder="e.g. Item 1" className={styles.ComboboxInput} />
      </label>
      <ul className={styles.ComboboxBaselineList}>
        {items.map((item) => (
          <li key={item} className={styles.ComboboxBaselineItem}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const variants: BenchmarkVariant[] = [
  { key: 'base-with-index', label: 'Base UI — with index', render: () => <ComboboxWithIndex /> },
  {
    key: 'base-without-index',
    label: 'Base UI — without index',
    render: () => <ComboboxWithoutIndex />,
  },
  {
    key: 'base-open-api',
    label: 'Base UI — open API (no filtering)',
    render: () => <ComboboxOpenApi />,
  },
  { key: 'plain', label: 'Plain input baseline', render: () => <PlainInputBaseline /> },
];

export default function ComboboxPerfExperiment() {
  return (
    <div className={styles.Container}>
      <h1>Combobox rendering performance</h1>
      <p>
        Each variant renders a single combobox with {ITEM_COUNT} items. Use the toolbar to switch
        variants, re-render the active one, or run multiple iterations for statistics.
      </p>
      <PerformanceBenchmark variants={variants} />
    </div>
  );
}
