'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

const ITEM_HEIGHT = 32;

export default function ExampleListboxVirtualized() {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState<number[]>([]);

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    // The same 2px spacing as the other examples.
    gap: 2,
    overscan: 5,
  });

  return (
    <div className={styles.Field}>
      <Listbox.Root
        multiple="opt-in"
        items={items}
        value={value}
        onValueChange={setValue}
        onItemHighlighted={(_, eventDetails) => {
          // Scroll the highlighted item into view.
          if (eventDetails.reason !== 'pointer' && eventDetails.index !== -1) {
            virtualizer.scrollToIndex(eventDetails.index);
          }
        }}
      >
        <Listbox.Label className={styles.Label}>Tracks</Listbox.Label>
        <Listbox.List ref={listRef} className={styles.List}>
          <div className={styles.Content} style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const track = tracks[virtualItem.index];
              return (
                <Listbox.Item
                  key={virtualItem.key}
                  value={track.id}
                  aria-setsize={tracks.length}
                  aria-posinset={virtualItem.index + 1}
                  className={styles.Item}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {track.title}
                </Listbox.Item>
              );
            })}
          </div>
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}

interface Track {
  id: number;
  title: string;
}

const tracks: Track[] = Array.from({ length: 3000 }, (_, index) => ({
  id: index + 1,
  title: `Track ${String(index + 1).padStart(4, '0')}`,
}));

// Every track, including those that aren't rendered, so keyboard navigation, typeahead and
// selection reach them all.
const items = Listbox.createItems(tracks, {
  getValue: (track) => track.id,
  getLabel: (track) => track.title,
  // For the demo, every tenth track is disabled.
  getDisabled: (track) => track.id % 10 === 0,
});
