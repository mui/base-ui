import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from '../popover.module.css';

/**
 * Recreation of the play-queue popover in the museeks music player's title bar:
 * the Trigger composes a custom icon button via `render`, while the Positioner's
 * `anchor` points at the whole header wrapper so the panel aligns with the bar,
 * not the small button. Recomposed from martpie/museeks `Header.tsx` (MIT,
 * code-ok, research/d-real-world-usage/popover/ranked.json #2).
 */

function ButtonIcon(props: React.ComponentProps<'button'>) {
  return <button type="button" {...props} />;
}

export function QueuePopoverExample() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  return (
    <div className={styles.QueueHeader} ref={headerRef}>
      <span className={styles.Label}>Nightfall — Aurora Fields</span>
      <Popover.Root>
        <Popover.Trigger
          render={<ButtonIcon aria-label="Open the queue" className={styles.IconButton} />}
        >
          ≡
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner anchor={headerRef} side="bottom" align="end" sideOffset={4}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Up next</Popover.Title>
              <ol className={styles.QueueList}>
                <li>Aurora Fields — Nightfall</li>
                <li>Glass Harbor — Undertow</li>
                <li>Marble Sky — Second Sun</li>
              </ol>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
