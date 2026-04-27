'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleMenu() {
  const [value, setValue] = React.useState('date');
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Sort <ChevronDownIcon className={styles.ButtonIcon} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Arrow className={styles.Arrow} />
            <Menu.RadioGroup value={value} onValueChange={setValue}>
              <Menu.RadioItem className={styles.RadioItem} value="date">
                <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                  <CheckIcon className={styles.RadioItemIndicatorIcon} />
                </Menu.RadioItemIndicator>
                <span className={styles.RadioItemText}>Date</span>
              </Menu.RadioItem>
              <Menu.RadioItem className={styles.RadioItem} value="name">
                <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                  <CheckIcon className={styles.RadioItemIndicatorIcon} />
                </Menu.RadioItemIndicator>
                <span className={styles.RadioItemText}>Name</span>
              </Menu.RadioItem>
              <Menu.RadioItem className={styles.RadioItem} value="type">
                <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                  <CheckIcon className={styles.RadioItemIndicatorIcon} />
                </Menu.RadioItemIndicator>
                <span className={styles.RadioItemText}>Type</span>
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
