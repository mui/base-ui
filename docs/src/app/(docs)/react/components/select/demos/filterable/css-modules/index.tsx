import * as React from 'react';
import { FilterableSelect } from '@base-ui/react/filterable-select';
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

export default function FilterableSelectDemo() {
  return (
    <div className={styles.Field}>
      <FilterableSelect.Root filter>
        <FilterableSelect.Label className={styles.Label}>Fruit</FilterableSelect.Label>
        <FilterableSelect.Trigger className={styles.Select}>
          <FilterableSelect.Value className={styles.Value} placeholder="Select a fruit" />
          <FilterableSelect.Icon>
            <CaretUpDownIcon />
          </FilterableSelect.Icon>
        </FilterableSelect.Trigger>
        <FilterableSelect.Portal>
          <FilterableSelect.Positioner className={styles.Positioner} sideOffset={4}>
            <FilterableSelect.Popup className={styles.Popup}>
              <div className={styles.InputContainer}>
                <FilterableSelect.Input
                  className={styles.Input}
                  aria-label="Filter fruits"
                  placeholder="e.g. Apple"
                />
                <FilterableSelect.Clear className={styles.Clear} aria-label="Clear filter">
                  <ClearIcon />
                </FilterableSelect.Clear>
              </div>
              <FilterableSelect.Empty className={styles.Empty}>
                No fruits found.
              </FilterableSelect.Empty>
              <FilterableSelect.List className={styles.List}>
                {fruits.map((fruit) => (
                  <FilterableSelect.Item key={fruit} value={fruit} className={styles.Item}>
                    <FilterableSelect.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </FilterableSelect.ItemIndicator>
                    <FilterableSelect.ItemText className={styles.ItemText}>
                      {fruit}
                    </FilterableSelect.ItemText>
                  </FilterableSelect.Item>
                ))}
              </FilterableSelect.List>
            </FilterableSelect.Popup>
          </FilterableSelect.Positioner>
        </FilterableSelect.Portal>
      </FilterableSelect.Root>
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
