'use client';
import * as React from 'react';
import { Draggable, type DragModifier, type DragLocationHistory } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

const eventKind = Draggable.createKind('calendar-event');
const dayColumnKind = Draggable.createKind<number>('calendar-day');

const DAYS = ['Monday', 'Tuesday', 'Wednesday'];
const START_HOUR = 9;
const TOTAL_MINUTES = 240; // the grid shows 9:00 – 13:00
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 16; // pixels per 15-minute slot; hour lines below are 4 slots (64px) apart
const EVENT_MINUTES = 60;
const EVENT_HEIGHT = (EVENT_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT;
const GRID_HEIGHT = (TOTAL_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT;
// The event's `inset-x-1` within its day column, in pixels.
const EVENT_INSET_X = 4;

interface CalendarEvent {
  day: number;
  /** Start time, in minutes from the top of the grid. */
  minute: number;
}

function formatTime(minute: number): string {
  const hour = START_HOUR + Math.floor(minute / 60);
  return `${hour}:${String(minute % 60).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// An hour line every 4 slots (see SLOT_HEIGHT).
const DAY_COLUMN_CLASS =
  'relative box-border border border-l-0 border-neutral-200 first:border-l bg-[repeating-linear-gradient(to_bottom,var(--color-neutral-200)_0_1px,transparent_1px_64px)] transition-colors data-[over]:bg-neutral-100 dark:border-neutral-700 dark:bg-[repeating-linear-gradient(to_bottom,var(--color-neutral-700)_0_1px,transparent_1px_64px)] dark:data-[over]:bg-neutral-800';

// The preview is a clone of the event, so it keeps these classes: `data-dragging`
// dims the source, `data-drag-preview` lifts the clone above the grid, and the
// keyboard drag mode eases the transform so slot-by-slot moves glide instead of
// teleporting (pointer drags keep an instant transform to track the cursor).
const EVENT_CLASS =
  'absolute inset-x-1 box-border flex flex-col gap-0.5 border border-neutral-950 bg-white px-2 py-1 text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white cursor-grab transition-[background-color,opacity] data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:data-[drag-preview]:shadow-none data-[drag-preview]:data-[drag-mode=keyboard]:transition-transform data-[drag-preview]:data-[drag-mode=keyboard]:duration-150 data-[drag-preview]:data-[drag-mode=keyboard]:ease-out hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function KeyboardMovementCalendar() {
  const [event, setEvent] = React.useState<CalendarEvent>({ day: 1, minute: 60 });
  const gridRef = React.useRef<HTMLDivElement>(null);

  // The day column under `clientX`, or the closest one when the cursor is over
  // the gutter or past the grid's edge.
  const nearestDayColumn = (clientX: number): { element: HTMLElement; rect: DOMRect } | null => {
    let best: { element: HTMLElement; rect: DOMRect } | null = null;
    let bestDistance = Infinity;
    gridRef.current?.querySelectorAll<HTMLElement>('[data-day-column]').forEach((element) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.max(rect.left - clientX, clientX - rect.right, 0);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { element, rect };
      }
    });
    return best;
  };

  // The event position a drag would commit, read off the day column the engine
  // resolved: its payload names the day, and its snapped local point the slot.
  // `anchor: 'source'` shifts by the grab offset, so the event's top edge
  // decides, wherever on it the user grabbed. Shared by the drop commit and
  // the keyboard announcement so both agree.
  const eventAfterDrag = (location: DragLocationHistory): CalendarEvent => {
    const column = location.current.dropTargets[0];
    if (!column || !dayColumnKind.matches(column)) {
      return event;
    }
    return {
      day: column.payload,
      minute: clamp(
        column.getSnappedLocalPoint({ anchor: 'source' }).y * TOTAL_MINUTES,
        0,
        TOTAL_MINUTES - EVENT_MINUTES,
      ),
    };
  };

  // Snap the whole drag onto the slot the drop will commit: the preview lands
  // on it, and the hit-test and reported input quantize with it, so what you
  // see is exactly what lands. The preview sits at `point − previewOffset`, so
  // the returned point is the slot origin — measured from the column's padding
  // box (`clientLeft`/`clientTop` skip its border) where the dropped event is
  // absolutely positioned — shifted back by the offset.
  const snapEventToGrid: DragModifier = ({ point, input, previewOffset }) => {
    const column = nearestDayColumn(input.x);
    if (!column) {
      return point;
    }
    const { element, rect } = column;
    const originX = rect.left + element.clientLeft;
    const originY = rect.top + element.clientTop;
    const slot = clamp(
      Math.round((point.y - previewOffset.y - originY) / SLOT_HEIGHT),
      0,
      (TOTAL_MINUTES - EVENT_MINUTES) / SLOT_MINUTES,
    );
    return {
      x: originX + EVENT_INSET_X + previewOffset.x,
      y: originY + slot * SLOT_HEIGHT + previewOffset.y,
    };
  };

  return (
    <div className="flex w-full flex-col gap-4 select-none">
      <div className="grid grid-cols-[3rem_repeat(3,1fr)]">
        <div />
        {DAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-[0.75rem] leading-4 font-semibold text-neutral-500 dark:text-neutral-400"
          >
            {day}
          </div>
        ))}
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {Array.from({ length: TOTAL_MINUTES / 60 + 1 }, (_, hour) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[0.75rem] leading-4 text-neutral-500 dark:text-neutral-400"
              style={{ top: hour * 4 * SLOT_HEIGHT }}
            >
              {formatTime(hour * 60)}
            </span>
          ))}
        </div>
        <div className="col-[2/-1] grid grid-cols-3" ref={gridRef} style={{ height: GRID_HEIGHT }}>
          {DAYS.map((day, index) => (
            <DropTarget.Root
              key={day}
              label={day}
              kind={dayColumnKind}
              payload={index}
              accept={eventKind}
              // One slot per 15 minutes: `getSnappedLocalPoint` reports the
              // landed slot as a fraction, whatever the column's height.
              snap={{ y: TOTAL_MINUTES / SLOT_MINUTES }}
              className={DAY_COLUMN_CLASS}
              data-day-column
            >
              {event.day === index && (
                <Draggable.Root
                  label="Design review"
                  kind={eventKind}
                  role="button"
                  className={EVENT_CLASS}
                  style={{ top: (event.minute / SLOT_MINUTES) * SLOT_HEIGHT, height: EVENT_HEIGHT }}
                  modifiers={snapEventToGrid}
                  // The engine can't know this grid's geometry: one 15-minute
                  // slot vertically, the same time in the day column ahead
                  // horizontally. No bounds checks: the modifier clamps at the
                  // grid's edges, and a press that moves nothing announces the
                  // edge on its own.
                  keyboardMovement={({ position, direction, findTarget }) => {
                    if (direction.y !== 0) {
                      return { x: position.x, y: position.y + direction.y * SLOT_HEIGHT };
                    }
                    const next = findTarget();
                    if (!next) {
                      return false; // already on the first/last day
                    }
                    const rect = next.getBoundingClientRect();
                    return { x: rect.left + rect.width / 2, y: position.y };
                  }}
                  keyboardAnnouncements={{
                    moved: ({ location }) => {
                      const next = eventAfterDrag(location);
                      return `${DAYS[next.day]}, ${formatTime(next.minute)}`;
                    },
                    reachedEdge: () => 'Edge of the calendar',
                  }}
                  // Only a drop over an accepting slot moves the event; a cancel
                  // or a release off the grid never reaches `onDrop`.
                  onDrop={({ location }) => setEvent(eventAfterDrag(location))}
                >
                  <span className="text-[0.75rem] leading-4 font-semibold">Design review</span>
                  <span className="text-[0.75rem] leading-4 text-neutral-500 dark:text-neutral-400">
                    {formatTime(event.minute)} – {formatTime(event.minute + EVENT_MINUTES)}
                  </span>
                  {/* `container` injects the clone into the grid element. */}
                  <Draggable.ClonedPreview container={gridRef} />
                </Draggable.Root>
              )}
            </DropTarget.Root>
          ))}
        </div>
      </div>
    </div>
  );
}
