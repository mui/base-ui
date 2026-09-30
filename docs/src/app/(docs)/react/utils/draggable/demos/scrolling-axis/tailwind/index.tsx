'use client';

import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { GripIcon } from '../../GripIcon';
import { DragPageAutoScroll } from '../../DragPageAutoScroll';

interface Stop {
  id: string;
  label: string;
}

const CONTROL_CLASS =
  'flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

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

// The preview is a clone of the stop, so it keeps these classes: `data-dragging`
// dims the source, `data-drag-preview` lifts the clone above the lane.
const STOP_CLASS =
  'inline-flex items-center gap-2 box-border border border-neutral-950 bg-white px-2.5 py-1.5 text-sm leading-5 whitespace-nowrap text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition-[background-color,opacity] data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-neutral-800';

export default function AxisLane() {
  const [stops, setStops] = React.useState(INITIAL_STOPS);
  const [selectedStop, setSelectedStop] = React.useState(INITIAL_STOPS[0].id);
  const selectedIndex = stops.findIndex((stop) => stop.id === selectedStop);
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
      <div className="flex w-full flex-col gap-4 select-none">
        <p className="m-0 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          Drag a stop toward the left or right edge and the lane scrolls to follow. It only scrolls
          sideways, so moving the pointer up or down never scrolls it.
        </p>
        {/* @highlight-start @focus */}
        <Draggable.Viewport
          onDragScroll={(eventDetails) => {
            if (eventDetails.direction !== 'horizontal') {
              eventDetails.cancel();
            }
          }}
          className="box-border overflow-x-auto border border-neutral-200 p-3 dark:border-neutral-700"
        >
          {/* @highlight-end */}
          <Draggable.Target
            ref={trackRef}
            className="flex w-max gap-1.5"
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
                className={STOP_CLASS}
              >
                <GripIcon className="flex-none text-neutral-400 dark:text-neutral-500" />
                {stop.label}
              </Draggable.Root>
            ))}
          </Draggable.Target>
        </Draggable.Viewport>
        <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-sm leading-5 font-medium text-neutral-950 dark:text-white">
            Move stop
          </legend>
          <select
            aria-label="Stop"
            className={CONTROL_CLASS}
            value={selectedStop}
            onChange={(event) => setSelectedStop(event.target.value)}
          >
            {stops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={CONTROL_CLASS}
            onClick={() => moveStop(selectedStop, selectedIndex - 1)}
          >
            Move left
          </button>
          <button
            type="button"
            className={CONTROL_CLASS}
            onClick={() => moveStop(selectedStop, selectedIndex + 2)}
          >
            Move right
          </button>
        </fieldset>
        <span role="status" style={visuallyHidden}>
          {announcement}
        </span>
      </div>
    </Draggable.Provider>
  );
}
