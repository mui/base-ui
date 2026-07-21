'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

export default function ExampleVirtualizedSelect() {
  return (
    <div className={styles.Field}>
      <Select.Root items={items}>
        <Select.Label className={styles.Label}>Item</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select item" />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.Positioner}
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                <Select.Virtualizer<string>
                  className={styles.Scroller}
                  estimatedItemHeight={32}
                  overscanPx={640}
                >
                  {(item) => (
                    <Select.Item value={item.value} className={styles.Item}>
                      <Select.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.ItemText}>{item.label}</Select.ItemText>
                    </Select.Item>
                  )}
                </Select.Virtualizer>
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

const items = Array.from({ length: 10000 }, (_, index) => {
  const number = String(index + 1).padStart(5, '0');
  return { value: number, label: `Item ${number}` };
});
