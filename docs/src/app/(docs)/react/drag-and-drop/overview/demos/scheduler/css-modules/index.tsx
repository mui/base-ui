'use client';
import * as React from 'react';
import { Draggable, type DragModifier, type DragLocationHistory } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../scheduler.module.css';

const eventKind = Draggable.createKind('calendar-event');
const dayColumnKind = Draggable.createKind<number>('calendar-day');

const DAYS = ['Monday', 'Tuesday', 'Wednesday'];
const START_HOUR = 9;
const TOTAL_MINUTES = 240; // the grid shows 9:00 – 13:00
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 16; // pixels per 15-minute slot; hour lines in the CSS are 4 slots (64px) apart
const EVENT_MINUTES = 60;
const EVENT_HEIGHT = (EVENT_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT;
const GRID_HEIGHT = (TOTAL_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT;
// The event's `inset-inline` within its day column, in pixels (0.25rem).
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
    <div className={styles.Root}>
      <div className={styles.Calendar}>
        <div />
        {DAYS.map((day) => (
          <div key={day} className={styles.DayHeader}>
            {day}
          </div>
        ))}
        <div className={styles.TimeGutter} style={{ height: GRID_HEIGHT }}>
          {Array.from({ length: TOTAL_MINUTES / 60 + 1 }, (_, hour) => (
            <span key={hour} className={styles.TimeLabel} style={{ top: hour * 4 * SLOT_HEIGHT }}>
              {formatTime(hour * 60)}
            </span>
          ))}
        </div>
        <div className={styles.Days} ref={gridRef} style={{ height: GRID_HEIGHT }}>
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
              className={styles.DayColumn}
              data-day-column
            >
              {event.day === index && (
                <Draggable.Root
                  label="Design review"
                  kind={eventKind}
                  role="button"
                  className={styles.Event}
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
                  <span className={styles.EventTitle}>Design review</span>
                  <span className={styles.EventTime}>
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
