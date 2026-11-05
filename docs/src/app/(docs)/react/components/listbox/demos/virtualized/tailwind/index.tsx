'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { useVirtualizer } from '@tanstack/react-virtual';

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
    <div className="flex flex-col gap-1">
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
        <Listbox.Label className="cursor-default text-sm leading-5 font-medium text-neutral-900 dark:text-neutral-100">
          Tracks
        </Listbox.Label>
        <Listbox.List
          ref={listRef}
          className="box-border h-80 w-64 overflow-y-auto py-1 rounded-md outline outline-1 outline-neutral-200 dark:outline-neutral-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const track = tracks[virtualItem.index];
              return (
                <Listbox.Item
                  key={virtualItem.key}
                  value={track.id}
                  aria-setsize={tracks.length}
                  aria-posinset={virtualItem.index + 1}
                  className="absolute top-0 left-0 z-0 box-border flex h-8 w-full items-center cursor-default px-4 text-sm leading-4 text-neutral-900 dark:text-neutral-100 outline-hidden select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-xs data-[highlighted]:not-data-[selected]:before:bg-neutral-100 dark:data-[highlighted]:not-data-[selected]:before:bg-neutral-800 data-[selected]:text-white data-[selected]:before:bg-neutral-950 dark:data-[selected]:text-neutral-950 dark:data-[selected]:before:bg-white data-[disabled]:text-neutral-400 dark:data-[disabled]:text-neutral-500"
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
