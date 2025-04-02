import * as React from 'react';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Menu } from '@base-ui-components/react/menu';
import styles from './index.module.css';

export default function ExampleMenu() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Trigger}>
        Right click here
      </ContextMenu.Trigger>
      <Menu.Root>
        <Menu.Portal>
          <Menu.Positioner
            className={styles.Positioner}
            align="start"
            alignOffset={5}
          >
            <Menu.Popup className={styles.Popup}>
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
    </ContextMenu.Root>
  );
}
