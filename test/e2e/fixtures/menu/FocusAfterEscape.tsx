import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './FocusAfterEscape.module.css';

export default function FocusAfterEscape() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button} data-testid="menu-trigger">
        Song
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Add to Playlist</Menu.Item>
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
