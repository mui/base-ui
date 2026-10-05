'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { GripIcon } from '../../GripIcon';
import { DragPageAutoScroll } from '../../DragPageAutoScroll';

import styles from '../../scrolling-axis.module.css';

interface Stop {
  id: string;
  label: string;
}

const stopKind = Draggable.createKind<string>('stop');

// Enough stops for the lane to overflow on mount, so dragging toward an edge
// has somewhere to scroll.
const INITIAL_STOPS: Stop[] = [
  { id: 'wake', label: 'Wake up' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'standup', label: 'Standup' },
  { id: 'review', label: 'Code review' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'design', label: 'Design sync' },
  { id: 'focus', label: 'Focus block' },
  { id: 'errands', label: 'Errands' },
  { id: 'gym', label: 'Gym' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'reading', label: 'Reading' },
  { id: 'sleep', label: 'Sleep' },
];

// Find the insertion slot closest to the pointer along the lane. Slots sit
// before the first stop, in the middle of each gap, and after the last stop.
function resolveDropIndex(track: HTMLElement, clientX: number): number {
  // The drag preview is a clone of the stop, so it has `data-stop` too. Skip it,
  // since it follows the pointer and isn't a real slot.
  const stops = Array.from(
    track.querySelectorAll<HTMLElement>('[data-stop]:not([data-drag-preview])'),
  );
  if (stops.length === 0) {
    return 0;
  }

  const rects = stops.map((stop) => stop.getBoundingClientRect());
  const slotXs = [rects[0].left];
  for (let i = 1; i < rects.length; i += 1) {
    slotXs.push((rects[i - 1].right + rects[i].left) / 2);
  }
  slotXs.push(rects[rects.length - 1].right);

  let index = 0;
  let bestDx = Infinity;
  for (let i = 0; i < slotXs.length; i += 1) {
    const dx = Math.abs(clientX - slotXs[i]);
    if (dx < bestDx) {
      bestDx = dx;
      index = i;
    }
  }
  return index;
}

export default function AxisLane() {
  const [stops, setStops] = React.useState(INITIAL_STOPS);
  const [announcement, setAnnouncement] = React.useState('');
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  function moveStop(id: string, insertIndex: number) {
    const sourceIndex = stops.findIndex((stop) => stop.id === id);
    // Dropping immediately before or after the source position is a no-op.
    if (
      sourceIndex === -1 ||
      insertIndex < 0 ||
      insertIndex > stops.length ||
      insertIndex === sourceIndex ||
      insertIndex === sourceIndex + 1
    ) {
      return;
    }
    const stop = stops[sourceIndex];
    const without = stops.filter((entry) => entry.id !== id);
    // Removing the stop shifts indices above the source down by one.
    const adjusted = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex;
    setStops([...without.slice(0, adjusted), stop, ...without.slice(adjusted)]);
    setAnnouncement(`${stop.label} moved to position ${adjusted + 1} of ${stops.length}.`);
  }

  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={stopKind} />
      <div className={styles.Root}>
        {/* @highlight-start @focus */}
        <Draggable.Viewport
          onDragScroll={(eventDetails) => {
            if (eventDetails.direction !== 'horizontal') {
              eventDetails.cancel();
            }
          }}
          className={styles.Lane}
        >
          {/* @highlight-end */}
          <Draggable.Target
            ref={trackRef}
            className={styles.Track}
            accept={stopKind}
            onDraggableDrop={(eventDetails) => {
              const track = trackRef.current;
              if (track) {
                moveStop(
                  eventDetails.source.payload,
                  resolveDropIndex(track, eventDetails.location.current.input.clientX),
                );
              }
            }}
          >
            {stops.map((stop, index) => (
              <Draggable.Root
                key={stop.id}
                kind={stopKind}
                payload={stop.id}
                data-stop
                render={<button type="button" aria-label={stop.label} />}
                aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
                onKeyDown={(event) => {
                  if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                    event.preventDefault();
                    moveStop(stop.id, event.key === 'ArrowLeft' ? index - 1 : index + 2);
                  }
                }}
                className={styles.Stop}
              >
                <GripIcon className={styles.Grip} />
                {stop.label}
              </Draggable.Root>
            ))}
          </Draggable.Target>
        </Draggable.Viewport>
        <span role="status" style={visuallyHidden}>
          {announcement}
        </span>
      </div>
    </Draggable.Provider>
  );
}
