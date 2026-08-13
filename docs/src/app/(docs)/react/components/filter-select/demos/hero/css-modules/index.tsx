'use client';
import * as React from 'react';
import { FilterSelect } from '@base-ui/react/filter-select';
import styles from './index.module.css';

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
  { value: 'peach', label: 'Peach' },
  { value: 'pear', label: 'Pear' },
  { value: 'pineapple', label: 'Pineapple' },
  { value: 'strawberry', label: 'Strawberry' },
];

export default function FilterSelectDemo() {
  return (
    <div className={styles.Field}>
      <FilterSelect.Root items={fruits}>
        <FilterSelect.Label className={styles.Label}>Fruit</FilterSelect.Label>
        <FilterSelect.Trigger className={styles.Select}>
          <FilterSelect.Value className={styles.Value} placeholder="Select a fruit" />
          <FilterSelect.Icon>
            <CaretUpDownIcon />
          </FilterSelect.Icon>
        </FilterSelect.Trigger>
        <FilterSelect.Portal>
          <FilterSelect.Positioner className={styles.Positioner} sideOffset={4}>
            <FilterSelect.Popup className={styles.Popup}>
              <div className={styles.InputContainer}>
                <FilterSelect.Input
                  className={styles.Input}
                  aria-label="Filter fruits"
                  placeholder="e.g. Apple"
                />
                <FilterSelect.Clear className={styles.Clear} aria-label="Clear filter">
                  <ClearIcon />
                </FilterSelect.Clear>
              </div>
              <FilterSelect.Empty className={styles.Empty}>No fruits found.</FilterSelect.Empty>
              <FilterSelect.List className={styles.List}>
                {(fruit: { value: string; label: string }) => (
                  <FilterSelect.Item key={fruit.value} value={fruit.value} className={styles.Item}>
                    <FilterSelect.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </FilterSelect.ItemIndicator>
                    <FilterSelect.ItemText className={styles.ItemText}>
                      {fruit.label}
                    </FilterSelect.ItemText>
                  </FilterSelect.Item>
                )}
              </FilterSelect.List>
            </FilterSelect.Popup>
          </FilterSelect.Positioner>
        </FilterSelect.Portal>
      </FilterSelect.Root>
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
