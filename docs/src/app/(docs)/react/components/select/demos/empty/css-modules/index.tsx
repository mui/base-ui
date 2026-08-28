import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

const items: Array<{ label: string; value: string }> = [];

export default function EmptySelect() {
  return (
    <div className={styles.Field}>
      <Select.Root items={items}>
        <Select.Label className={styles.Label}>Apple</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select apple" />
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
              <Select.Empty>
                <div className={styles.Empty}>No apples available.</div>
              </Select.Empty>
              <Select.List>
                {items.map(({ label, value }) => (
                  <Select.Item key={value} value={value}>
                    {label}
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
