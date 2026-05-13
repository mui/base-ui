'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function MenuArrowDemo() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.Positioner}
          sideOffset={({ side }) => (side === 'top' ? 12 : 8)}
        >
          <Menu.Popup className={styles.Popup}>
            <Menu.Arrow className={styles.Arrow} />
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Add to Playlist</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
            <Menu.Item className={styles.Item}>Play Last</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Favorite</Menu.Item>
            <Menu.Item className={styles.Item}>Share</Menu.Item>
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
