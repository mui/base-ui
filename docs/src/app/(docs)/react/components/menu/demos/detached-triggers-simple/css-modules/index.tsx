'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from '../../_index.module.css';

const demoMenu = Menu.createHandle();

export default function MenuDetachedTriggersSimpleDemo() {
  return (
    <React.Fragment>
      <Menu.Trigger className={styles.IconButton} handle={demoMenu} aria-label="Project actions">
        <DotsIcon className={styles.Icon} />
      </Menu.Trigger>

      <Menu.Root handle={demoMenu}>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} className={styles.Positioner}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Arrow className={styles.Arrow} />

              <Menu.Item className={styles.Item}>Rename</Menu.Item>
              <Menu.Item className={styles.Item}>Duplicate</Menu.Item>
              <Menu.Item className={styles.Item}>Move to folder</Menu.Item>
              <Menu.Separator className={styles.Separator} />
              <Menu.Item className={styles.Item}>Archive</Menu.Item>
              <Menu.Item className={styles.Item}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </React.Fragment>
  );
}

function DotsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
