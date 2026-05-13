import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger openOnHover className={styles.Button}>
        Add to playlist <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Get Up!</Menu.Item>
            <Menu.Item className={styles.Item}>Inside Out</Menu.Item>
            <Menu.Item className={styles.Item}>Night Beats</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>New playlist…</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 10 10"
      fill="none"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
