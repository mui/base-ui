import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';

// --- Domain types ---

export type EventId = string;

export interface CalendarEvent {
  id: EventId;
  title: string;
  /** ms timestamp, inclusive. */
  start: number;
  /** ms timestamp, exclusive. */
  end: number;
  /** All-day events start and end on local midnight. */
  allDay: boolean;
}

export type CalendarViewMode = 'month' | 'week';

export interface CalendarState {
  events: Record<EventId, CalendarEvent>;
  order: EventId[];
}

// --- Drag kinds and payloads ---

export const calEventMoveKind = Draggable.createKind<EventMoveDragPayload>(
  'baseUiPlusCalendar/event-move',
);
export const calEventResizeKind = Draggable.createKind<EventResizeDragPayload>(
  'baseUiPlusCalendar/event-resize',
);
export const calEventCreateKind = Draggable.createKind<EventCreateDragPayload>(
  'baseUiPlusCalendar/event-create',
);
export const calDayCellKind = Draggable.createKind<DayCellDropPayload>(
  'baseUiPlusCalendar/day-cell',
);
export const calDayColumnKind = Draggable.createKind<DayColumnDropPayload>(
  'baseUiPlusCalendar/day-column',
);
export const calAllDayRowKind = Draggable.createKind<AllDayRowDropPayload>(
  'baseUiPlusCalendar/all-day-row',
);

/** Every kind a calendar drag source can have. Every target uses this as its `accept`. */
export const CAL_DRAG_KINDS = [calEventMoveKind, calEventResizeKind, calEventCreateKind];

export interface EventMoveDragPayload {
  eventId: EventId;
  /** Event bounds at drag start, used to keep the duration. */
  anchorStart: number;
  anchorEnd: number;
  allDay: boolean;
  /**
   * How far, in ms, the grabbed chip's top sits past the event's start. Non-zero only
   * for a segment of an event that crosses midnight. The grab offset inside the chip is
   * handled by `getSnappedLocalPoint({ anchor: 'source' })`.
   */
  segmentOffsetMs: number;
}

export interface EventResizeDragPayload {
  eventId: EventId;
  edge: 'start' | 'end';
  anchorStart: number;
  anchorEnd: number;
  allDay: boolean;
}

export interface EventCreateDragPayload {
  /** Where the create gesture began, in ms. Aligned to the day for all-day events. */
  anchorMs: number;
  allDay: boolean;
}

export interface DayCellDropPayload {
  /** Start-of-day ms timestamp for the cell. */
  dayMs: number;
}

export interface DayColumnDropPayload {
  dayMs: number;
}

export interface AllDayRowDropPayload {
  dayMs: number;
}

export type CalendarDragSource =
  EventMoveDragPayload | EventResizeDragPayload | EventCreateDragPayload;
export type CalendarDropPayload = DayCellDropPayload | DayColumnDropPayload | AllDayRowDropPayload;

// --- Drop preview, the ghost drawn during a drag ---

export interface DropPreview {
  start: number;
  end: number;
  allDay: boolean;
  /** What the drop will do. Sets the preview outline and label. */
  intent: 'move' | 'resize' | 'create';
}

// --- Reducer ---

export type CalendarAction =
  | { type: 'MOVE_EVENT'; id: EventId; newStart: number; newAllDay?: boolean }
  | { type: 'RESIZE_EVENT'; id: EventId; edge: 'start' | 'end'; newTime: number }
  | { type: 'CREATE_EVENT'; event: CalendarEvent }
  | { type: 'RESET'; state: CalendarState };

export function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'MOVE_EVENT': {
      const event = state.events[action.id];
      if (!event) {
        return state;
      }
      const duration = event.end - event.start;
      const allDay = action.newAllDay ?? event.allDay;
      const start = allDay ? startOfDay(action.newStart) : action.newStart;
      const end = allDay
        ? addDays(start, event.allDay ? spanDays(event) : Math.max(1, Math.ceil(duration / DAY_MS)))
        : start + duration;
      return {
        ...state,
        events: {
          ...state.events,
          [action.id]: { ...event, start, end, allDay },
        },
      };
    }

    case 'RESIZE_EVENT': {
      const event = state.events[action.id];
      if (!event) {
        return state;
      }
      let nextStart = event.start;
      let nextEnd = event.end;
      if (action.edge === 'start') {
        nextStart = event.allDay ? startOfDay(action.newTime) : action.newTime;
      } else {
        // The preview already supplies an exclusive end boundary.
        nextEnd = event.allDay ? startOfDay(action.newTime) : action.newTime;
      }
      // If the dragged edge crossed the other one, keep a minimum duration of one day
      // or `MIN_TIMED_DURATION_MS`.
      if (nextEnd <= nextStart) {
        if (event.allDay) {
          if (action.edge === 'start') {
            nextStart = addDays(nextEnd, -1);
          } else {
            nextEnd = addDays(nextStart, 1);
          }
        } else if (action.edge === 'start') {
          nextStart = nextEnd - MIN_TIMED_DURATION_MS;
        } else {
          nextEnd = nextStart + MIN_TIMED_DURATION_MS;
        }
      }
      return {
        ...state,
        events: {
          ...state.events,
          [action.id]: { ...event, start: nextStart, end: nextEnd },
        },
      };
    }

    case 'CREATE_EVENT': {
      if (state.events[action.event.id]) {
        return state;
      }
      return {
        events: { ...state.events, [action.event.id]: action.event },
        order: [...state.order, action.event.id],
      };
    }

    case 'RESET':
      return action.state;

    default:
      return state;
  }
}

// --- Date math ---

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const MIN_TIMED_DURATION_MS = 15 * MINUTE_MS;

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfWeek(ms: number, weekStartsOn: 0 | 1 = 1): number {
  const d = new Date(startOfDay(ms));
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function startOfMonth(ms: number): number {
  const d = new Date(ms);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function addMonths(ms: number, months: number): number {
  const d = new Date(ms);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const endOfMonth = new Date(d);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
  d.setDate(Math.min(day, endOfMonth.getDate()));
  return d.getTime();
}

export function diffDays(aMs: number, bMs: number): number {
  return Math.round((startOfDay(aMs) - startOfDay(bMs)) / DAY_MS);
}

export function isSameDay(aMs: number, bMs: number): boolean {
  return startOfDay(aMs) === startOfDay(bMs);
}

export function snapToMinutes(ms: number, stepMinutes: number): number {
  if (stepMinutes <= 0) {
    return ms;
  }
  const step = stepMinutes * MINUTE_MS;
  return Math.round(ms / step) * step;
}

/** Build a 6x7 grid around the month of `monthMs`. Always 42 cells, so the height never changes. */
export function buildMonthGrid(monthMs: number, weekStartsOn: 0 | 1 = 1): number[] {
  const monthStart = startOfMonth(monthMs);
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  const days: number[] = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

export function buildWeekDays(weekStartMs: number): number[] {
  const days: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    days.push(addDays(weekStartMs, i));
  }
  return days;
}

// --- Event utilities ---

/** Inclusive day count an event spans. A 1h event = 1, a 2-day event = 2. */
export function spanDays(event: { start: number; end: number; allDay: boolean }): number {
  if (event.allDay) {
    return Math.max(1, diffDays(event.end, event.start));
  }
  const startDay = startOfDay(event.start);
  // `end` is exclusive, so an event ending at midnight doesn't count the next day.
  const endDay = startOfDay(event.end - 1);
  return Math.max(1, diffDays(endDay, startDay) + 1);
}

export function eventOverlapsRange(
  event: { start: number; end: number },
  rangeStart: number,
  rangeEnd: number,
): boolean {
  return event.start < rangeEnd && event.end > rangeStart;
}

let idCounter = 0;
export function makeEventId(): EventId {
  idCounter += 1;
  return `evt-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seed events around `today`, mixing timed, all-day and multi-day events. */
export function createSeedState(today: number): CalendarState {
  const monday = startOfWeek(today);
  const events: Record<EventId, CalendarEvent> = {};
  const order: EventId[] = [];

  const push = (event: Omit<CalendarEvent, 'id'>) => {
    const id = makeEventId();
    events[id] = { ...event, id };
    order.push(id);
  };

  push({
    title: 'Standup',
    start: addDays(monday, 0) + 9 * HOUR_MS,
    end: addDays(monday, 0) + 9.5 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Design review',
    start: addDays(monday, 0) + 13 * HOUR_MS,
    end: addDays(monday, 0) + 14.5 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Pair programming',
    start: addDays(monday, 1) + 10 * HOUR_MS,
    end: addDays(monday, 1) + 12 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Lunch & learn',
    start: addDays(monday, 1) + 12 * HOUR_MS,
    end: addDays(monday, 1) + 13 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Customer call',
    start: addDays(monday, 2) + 15 * HOUR_MS,
    end: addDays(monday, 2) + 16 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Conference',
    start: addDays(monday, 2),
    end: addDays(monday, 5),
    allDay: true,
  });
  push({
    title: 'Late deploy window',
    start: addDays(monday, 3) + 22 * HOUR_MS,
    end: addDays(monday, 4) + 2 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Focus block',
    start: addDays(monday, 4) + 9 * HOUR_MS,
    end: addDays(monday, 4) + 12 * HOUR_MS,
    allDay: false,
  });
  push({
    title: 'Team offsite',
    start: addDays(monday, -3),
    end: addDays(monday, 0),
    allDay: true,
  });
  push({
    title: 'Long sprint',
    start: addDays(monday, -1),
    end: addDays(monday, 4),
    allDay: true,
  });

  return { events, order };
}

// --- Drop resolution ---

function isCalendarDropTarget(
  target: Draggable.Target.Record,
): target is Draggable.Target.Record<CalendarDropPayload> {
  return (
    calDayCellKind.matches(target) ||
    calDayColumnKind.matches(target) ||
    calAllDayRowKind.matches(target)
  );
}

/**
 * Turn the drop target under the pointer into the start, end and `allDay` the reducer
 * applies. No measuring or rounding: the day columns declare `snap`, so
 * `getSnappedLocalPoint` is already on the grid.
 */
export function resolveDropPreview(
  source: Draggable.Root.Record<CalendarDragSource>,
  dropTarget: Draggable.Target.Record | null,
): DropPreview | null {
  if (!dropTarget || !isCalendarDropTarget(dropTarget)) {
    return null;
  }

  // On-grid time under the pointer, or under the grabbed chip's top edge with the
  // `'source'` anchor. Capped so the last slot stays inside the day.
  const timedMsAt = (dayMs: number, anchor?: 'source'): number => {
    const fraction = dropTarget.getSnappedLocalPoint({ anchor }).y;
    return Math.min(dayMs + DAY_MS - MINUTE_MS, dayMs + fraction * DAY_MS);
  };

  // The three drop payloads have the same shape, so narrowing `dropTarget` to one kind
  // types it as `never` in the later branches. Read the shared field once instead.
  const targetDayMs = dropTarget.payload.dayMs;

  if (calEventMoveKind.matches(source)) {
    const sourcePayload = source.payload;
    const duration = sourcePayload.anchorEnd - sourcePayload.anchorStart;
    if (calDayCellKind.matches(dropTarget)) {
      // Month view. Keep the time of day and change the date.
      const dayMs = targetDayMs;
      const offset = sourcePayload.allDay
        ? 0
        : sourcePayload.anchorStart - startOfDay(sourcePayload.anchorStart);
      const start = dayMs + offset;
      return {
        start,
        end: sourcePayload.allDay
          ? addDays(start, diffDays(sourcePayload.anchorEnd, sourcePayload.anchorStart))
          : start + duration,
        allDay: sourcePayload.allDay,
        intent: 'move',
      };
    }
    if (calAllDayRowKind.matches(dropTarget)) {
      const start = targetDayMs;
      return {
        start,
        end: addDays(
          start,
          sourcePayload.allDay
            ? Math.max(1, diffDays(sourcePayload.anchorEnd, sourcePayload.anchorStart))
            : Math.max(1, Math.ceil(duration / DAY_MS)),
        ),
        allDay: true,
        intent: 'move',
      };
    }
    if (calDayColumnKind.matches(dropTarget)) {
      // Week view. The `'source'` anchor keeps the grab offset, so the chip's top
      // doesn't jump to the cursor.
      const start = timedMsAt(targetDayMs, 'source') - sourcePayload.segmentOffsetMs;
      return {
        start,
        end: start + duration,
        allDay: false,
        intent: 'move',
      };
    }
    return null;
  }

  if (calEventResizeKind.matches(source)) {
    const sourcePayload = source.payload;
    if (calDayCellKind.matches(dropTarget)) {
      // Month view resize uses local midnight boundaries, with an exclusive end.
      const time = targetDayMs;
      if (sourcePayload.edge === 'start') {
        const start = Math.min(time, addDays(sourcePayload.anchorEnd, -1));
        return {
          start,
          end: sourcePayload.anchorEnd,
          allDay: sourcePayload.allDay,
          intent: 'resize',
        };
      }
      const end = Math.max(addDays(time, 1), addDays(sourcePayload.anchorStart, 1));
      return {
        start: sourcePayload.anchorStart,
        end,
        allDay: sourcePayload.allDay,
        intent: 'resize',
      };
    }
    if (calAllDayRowKind.matches(dropTarget)) {
      const time = targetDayMs;
      if (sourcePayload.edge === 'start') {
        const start = Math.min(time, addDays(sourcePayload.anchorEnd, -1));
        return {
          start,
          end: sourcePayload.anchorEnd,
          allDay: true,
          intent: 'resize',
        };
      }
      const end = Math.max(addDays(time, 1), addDays(sourcePayload.anchorStart, 1));
      return { start: sourcePayload.anchorStart, end, allDay: true, intent: 'resize' };
    }
    if (calDayColumnKind.matches(dropTarget)) {
      const pointerMs = timedMsAt(targetDayMs);
      if (sourcePayload.edge === 'start') {
        const start = Math.min(pointerMs, sourcePayload.anchorEnd - MIN_TIMED_DURATION_MS);
        return {
          start,
          end: sourcePayload.anchorEnd,
          allDay: false,
          intent: 'resize',
        };
      }
      const end = Math.max(pointerMs, sourcePayload.anchorStart + MIN_TIMED_DURATION_MS);
      return {
        start: sourcePayload.anchorStart,
        end,
        allDay: false,
        intent: 'resize',
      };
    }
    return null;
  }

  if (calEventCreateKind.matches(source)) {
    const sourcePayload = source.payload;
    if (sourcePayload.allDay) {
      // Month view. Span from the anchor to the cell under the pointer.
      if (calDayCellKind.matches(dropTarget) || calAllDayRowKind.matches(dropTarget)) {
        const dayMs = targetDayMs;
        const lo = Math.min(sourcePayload.anchorMs, dayMs);
        const hi = Math.max(sourcePayload.anchorMs, dayMs);
        return {
          start: lo,
          end: addDays(hi, 1),
          allDay: true,
          intent: 'create',
        };
      }
      return null;
    }
    // Timed create, possibly across columns. Both ends are on the grid: the anchor
    // snapped at gesture start, and the column's `snap` handles the pointer.
    if (calDayColumnKind.matches(dropTarget)) {
      const pointerMs = timedMsAt(targetDayMs);
      const lo = Math.min(sourcePayload.anchorMs, pointerMs);
      const hi = Math.max(sourcePayload.anchorMs, pointerMs);
      return {
        start: lo,
        end: Math.max(hi, lo + MIN_TIMED_DURATION_MS),
        allDay: false,
        intent: 'create',
      };
    }
    return null;
  }

  return null;
}

// --- Month-view track layout ---

export interface WeekEventSegment {
  eventId: EventId;
  /** Column where the bar starts in the week row, from 0 to 6. */
  startCol: number;
  /** Number of columns the bar spans, from 1 to 7. */
  span: number;
  /** Row inside the week. */
  track: number;
  /** Continues from previous week. */
  continuesFromBefore: boolean;
  /** Continues into next week. */
  continuesAfter: boolean;
}

/** Greedy track assignment: events sorted by start, longest first, take the lowest free track. */
export function layoutWeekSegments(
  events: CalendarEvent[],
  weekStartMs: number,
): WeekEventSegment[] {
  const weekEndMs = addDays(weekStartMs, 7);
  const visible = events
    .filter((event) => eventOverlapsRange(event, weekStartMs, weekEndMs))
    .sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }
      return b.end - a.end;
    });

  // The last column each track is occupied up to.
  const trackEndCols: number[] = [];
  const segments: WeekEventSegment[] = [];

  for (const event of visible) {
    const startMs = Math.max(event.start, weekStartMs);
    const endMs = Math.min(event.end, weekEndMs);
    const startCol = Math.max(0, Math.min(6, diffDays(startMs, weekStartMs)));
    // `end` is exclusive, so the last day with content holds `end - 1ms`.
    const lastDay = diffDays(endMs - 1, weekStartMs);
    const endCol = Math.max(startCol, Math.min(6, lastDay));
    const span = endCol - startCol + 1;

    let track = trackEndCols.findIndex((trackEndCol) => trackEndCol < startCol);
    if (track === -1) {
      track = trackEndCols.length;
    }
    trackEndCols[track] = endCol;

    segments.push({
      eventId: event.id,
      startCol,
      span,
      track,
      continuesFromBefore: event.start < weekStartMs,
      continuesAfter: event.end > weekEndMs,
    });
  }
  return segments;
}

// --- View context ---

export interface CalendarViewContextValue {
  events: CalendarEvent[];
  dispatch: React.Dispatch<CalendarAction>;
  /** Snap granularity in minutes, applied to timed drags. */
  snapMinutes: number;
  weekStartsOn: 0 | 1;
  /** Pixels per hour in the week view. */
  hourPx: number;
  /**
   * Captured on mount so render code can compare dates without `Date.now()`, which
   * lint flags as impure. Updates on Today and Reset.
   */
  todayMs: number;
  dropPreview: DropPreview | null;
  setDropPreview: (next: DropPreview | null) => void;
  /** Returns the current preview and clears it when a drop commits. */
  consumeDropPreview: () => DropPreview | null;
  dropPreviewRef: React.RefObject<DropPreview | null>;
}

const CalendarViewContext = React.createContext<CalendarViewContextValue | null>(null);

export const CalendarViewProvider = CalendarViewContext.Provider;

export function useCalendarView(): CalendarViewContextValue {
  const ctx = React.useContext(CalendarViewContext);
  if (!ctx) {
    throw new Error('Calendar view components must be rendered inside the CalendarExperiment.');
  }
  return ctx;
}

// --- Formatting helpers ---

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const RANGE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export function formatTime(ms: number): string {
  return TIME_FORMATTER.format(ms);
}

export function formatRange(startMs: number, endMs: number, allDay: boolean): string {
  if (allDay) {
    const days = Math.max(1, diffDays(endMs, startMs));
    if (days === 1) {
      return RANGE_FORMATTER.format(startMs);
    }
    return `${RANGE_FORMATTER.format(startMs)} – ${RANGE_FORMATTER.format(addDays(endMs, -1))} (${days} days)`;
  }
  const sameDay = isSameDay(startMs, endMs - 1);
  if (sameDay) {
    return `${formatTime(startMs)} – ${formatTime(endMs)}`;
  }
  return `${RANGE_FORMATTER.format(startMs)} ${formatTime(startMs)} – ${RANGE_FORMATTER.format(endMs)} ${formatTime(endMs)}`;
}
