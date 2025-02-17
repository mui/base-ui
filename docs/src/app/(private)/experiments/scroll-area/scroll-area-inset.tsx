import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import styles from './scroll-area-inset.module.css';

export default function ScrollAreaInset() {
  return (
    <div>
      <p>
        Scroll content is not clipped by inset scrollbars (user-defined paddings)
      </p>
      <ScrollArea.Root className={styles.Root}>
        <ScrollArea.Viewport className={styles.Viewport}>
          <div className={styles.Content}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
              commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
              velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={styles.Scrollbar} orientation="vertical">
          <ScrollArea.Thumb className={styles.Thumb} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar className={styles.Scrollbar} orientation="horizontal">
          <ScrollArea.Thumb className={styles.Thumb} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </div>
  );
}
