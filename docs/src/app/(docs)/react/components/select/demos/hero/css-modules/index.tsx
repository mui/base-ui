import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
  { label: 'Pink Lady', value: 'pink-lady' },
];

export default function ExampleSelect() {
  return (
    <div className={styles.Field}>
      <Select.Root items={apples}>
        <Select.Label className={styles.Label}>Apple</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select apple" />
          <Select.Icon className={styles.SelectIcon}>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={8}>
            <Select.Popup className={styles.Popup}>
              <Select.ScrollUpArrow className={styles.ScrollArrow}>⏶</Select.ScrollUpArrow>
              <Select.List className={styles.List}>
                {apples.map(({ label, value }) => (
                  <Select.Item key={label} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={styles.ScrollArrow}>⏷</Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m7 15 5 5 5-5" vectorEffect="non-scaling-stroke" />
      <path d="m7 9 5-5 5 5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M20 6 9 17l-5-5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
