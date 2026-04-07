import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleContextMenu() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Trigger}>Right click here</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.Positioner}>
          <ContextMenu.Popup className={styles.Popup}>
            <ContextMenu.Item className={styles.Item}>Add to Library</ContextMenu.Item>

            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger className={styles.SubmenuTrigger}>
                Add to Playlist
                <ChevronRightIcon />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner
                  className={styles.Positioner}
                  alignOffset={-4}
                  sideOffset={-4}
                >
                  <ContextMenu.Popup className={styles.SubmenuPopup}>
                    <ContextMenu.Item className={styles.Item}>Get Up!</ContextMenu.Item>
                    <ContextMenu.Item className={styles.Item}>Inside Out</ContextMenu.Item>
                    <ContextMenu.Item className={styles.Item}>Night Beats</ContextMenu.Item>
                    <Menu.Separator className={styles.Separator} />
                    <ContextMenu.Item className={styles.Item}>New playlist…</ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.SubmenuRoot>

            <ContextMenu.Separator className={styles.Separator} />
            <ContextMenu.Item className={styles.Item}>Play Next</ContextMenu.Item>
            <ContextMenu.Item className={styles.Item}>Play Last</ContextMenu.Item>
            <ContextMenu.Separator className={styles.Separator} />
            <ContextMenu.Item className={styles.Item}>Favorite</ContextMenu.Item>
            <ContextMenu.Item className={styles.Item}>Share</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}
