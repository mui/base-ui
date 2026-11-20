'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { useVirtualizer } from '@tanstack/react-virtual';

const ITEM_HEIGHT = 32;

export default function ExampleListboxVirtualized() {
  const listRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <Listbox.Root
      items={items}
      onItemHighlighted={(_, eventDetails) => {
        // Scroll the highlighted item into view.
        if (eventDetails.reason !== 'pointer' && eventDetails.index !== -1) {
          virtualizer.scrollToIndex(eventDetails.index);
        }
      }}
    >
      <div className="w-64 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
        <div className="border-b border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
          <Listbox.Label className="cursor-default text-sm font-bold">Tracks</Listbox.Label>
        </div>
        <Listbox.List ref={listRef} className="h-80 overflow-y-auto outline-hidden">
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const track = tracks[virtualItem.index];
              return (
                <Listbox.Item
                  key={virtualItem.key}
                  value={track.id}
                  aria-setsize={tracks.length}
                  aria-posinset={virtualItem.index + 1}
                  className="absolute top-0 left-0 grid h-8 w-full cursor-default grid-cols-[1rem_1fr] items-center gap-3 px-3.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-800 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <Listbox.ItemIndicator className="col-start-1">
                    <CheckIcon />
                  </Listbox.ItemIndicator>
                  <span className="col-start-2">{track.title}</span>
                </Listbox.Item>
              );
            })}
          </div>
        </Listbox.List>
      </div>
    </Listbox.Root>
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

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}
