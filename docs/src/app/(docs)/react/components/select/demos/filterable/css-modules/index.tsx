import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Kiwi',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Strawberry',
];

export default function FilterableSelect() {
  return (
    <div className={styles.Field}>
      <Select.Root filter>
        <Select.Label className={styles.Label}>Fruit</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select a fruit" />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <div className={styles.InputContainer}>
                <Select.Input
                  className={styles.Input}
                  aria-label="Filter fruits"
                  placeholder="e.g. Apple"
                />
                <Select.Clear className={styles.Clear} aria-label="Clear filter">
                  <ClearIcon />
                </Select.Clear>
              </div>
              <Select.Empty className={styles.Empty}>No fruits found.</Select.Empty>
              <Select.List className={styles.List}>
                {fruits.map((fruit) => (
                  <Select.Item key={fruit} value={fruit} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{fruit}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}
