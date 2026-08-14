'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import styles from '../../axis.module.css';

interface Stop {
  id: string;
  label: string;
}

const stopKind = Draggable.createKind<string>('stop');

// Enough stops that the lane overflows its width and is scrollable on mount, so
// dragging toward an edge has somewhere to scroll.
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

// Resolve the insertion slot closest to the pointer along the lane. Candidate
// slots sit before the first stop, between consecutive stops (the midpoint of
// each gap), and after the last one.
function resolveDropIndex(track: HTMLElement, clientX: number): number {
  // The dragged stop's preview is a clone injected next to it, and it carries
  // the same `data-stop`. Skip it: it follows the pointer and is not a real slot.
  const stops = Array.from(
    track.querySelectorAll<HTMLElement>('[data-stop]:not([data-drag-preview])'),
  );
  if (stops.length === 0) {
    return 0;
  }

  const slotXs = [stops[0].getBoundingClientRect().left];
  for (let i = 1; i < stops.length; i += 1) {
    const previous = stops[i - 1].getBoundingClientRect();
    const current = stops[i].getBoundingClientRect();
    slotXs.push((previous.right + current.left) / 2);
  }
  slotXs.push(stops[stops.length - 1].getBoundingClientRect().right);

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

function Grip() {
  return (
    <svg className={styles.Grip} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

export default function AxisLane() {
  const [stops, setStops] = React.useState(INITIAL_STOPS);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  function moveStop(id: string, insertIndex: number) {
    setStops((previous) => {
      const sourceIndex = previous.findIndex((stop) => stop.id === id);
      // Dropping immediately before or after the source position is a no-op.
      if (sourceIndex === -1 || insertIndex === sourceIndex || insertIndex === sourceIndex + 1) {
        return previous;
      }
      const stop = previous[sourceIndex];
      const without = previous.filter((entry) => entry.id !== id);
      // Removing the stop shifts indices above the source down by one.
      const adjusted = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex;
      return [...without.slice(0, adjusted), stop, ...without.slice(adjusted)];
    });
  }

  return (
    <div className={styles.Root}>
      <p className={styles.Hint}>
        Drag a stop toward the left or right edge and the lane scrolls to follow. It only scrolls
        sideways, so moving the pointer up or down never scrolls it.
      </p>
      <DragAutoScroll.Root allowedAxis="horizontal" className={styles.Lane}>
        <DropTarget.Root
          ref={trackRef}
          className={styles.Track}
          label="Stop lane"
          accept={stopKind}
          trackDragOver={false}
          onDrop={({ source, location }) => {
            const track = trackRef.current;
            if (track) {
              moveStop(source.payload, resolveDropIndex(track, location.current.input.clientX));
            }
          }}
        >
          {stops.map((stop) => (
            <Draggable.Root
              key={stop.id}
              label={stop.label}
              kind={stopKind}
              payload={stop.id}
              data-stop
              role="button"
              className={styles.Stop}
            >
              <Grip />
              {stop.label}
            </Draggable.Root>
          ))}
        </DropTarget.Root>
      </DragAutoScroll.Root>
    </div>
  );
}
