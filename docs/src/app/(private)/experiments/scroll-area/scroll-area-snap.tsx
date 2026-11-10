'use client';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './scroll-area-snap.module.css';

const ITEMS = Array.from({ length: 10 }, (_, index) => index + 1);

function Items() {
  return (
    <div className={styles.Row}>
      {ITEMS.map((item) => (
        <div key={item} className={styles.Item}>
          {item}
        </div>
      ))}
    </div>
  );
}

export default function ScrollAreaSnap() {
  return (
    <div className={styles.Container}>
      <p>
        Dragging the thumb should track the pointer continuously and only snap to the nearest item
        once the pointer is released, matching the native scroller below.
      </p>

      <div>
        <h2 className={styles.Heading}>Scroll area</h2>
        <ScrollArea.Root className={styles.ScrollAreaRoot}>
          <ScrollArea.Viewport className={styles.ScrollAreaViewport}>
            <Items />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" className={styles.ScrollAreaScrollbar}>
            <ScrollArea.Thumb className={styles.ScrollAreaThumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      <div>
        <h2 className={styles.Heading}>Native scroller</h2>
        <div className={styles.NativeScroller}>
          <Items />
        </div>
      </div>
    </div>
  );
}
