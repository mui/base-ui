import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import type { DropTargetRecord, DragSource } from '@base-ui/react/types';

// -----------------------------------------------------------------------------
// Domain types
// -----------------------------------------------------------------------------

export type EventId = string;

export interface CalendarEvent {
  id: EventId;
  title: string;
  /** ms timestamp, inclusive. */
  start: number;
  /** ms timestamp, exclusive. */
  end: number;
  /**
   * `true` for whole-day events. All-day events have start/end aligned to
   * local midnight; their duration is a multiple of 24 hours.
   */
  allDay: boolean;
}

export type CalendarViewMode = 'month' | 'week';

export interface CalendarState {
  events: Record<EventId, CalendarEvent>;
  order: EventId[];
}

// -----------------------------------------------------------------------------
// Drag data sentinels
// -----------------------------------------------------------------------------

// Sources tag with `kind` on `Draggable.Root`; drop targets and monitors declare which
// of them they take through `accept`. Each kind carries the payload type its side of
// the drag reads, and its label is namespaced: labels are page-global names.
export const calEventMoveKind = Draggable.createKind<EventMoveDragData>(
  'baseUiPlusCalendar/event-move',
);
export const calEventResizeKind = Draggable.createKind<EventResizeDragData>(
  'baseUiPlusCalendar/event-resize',
);
export const calEventCreateKind = Draggable.createKind<EventCreateDragData>(
  'baseUiPlusCalendar/event-create',
);
export const calDayCellKind = Draggable.createKind<DayCellDropData>('baseUiPlusCalendar/day-cell');
export const calDayColumnKind = Draggable.createKind<DayColumnDropData>(
  'baseUiPlusCalendar/day-column',
);
export const calAllDayRowKind = Draggable.createKind<AllDayRowDropData>(
  'baseUiPlusCalendar/all-day-row',
);

/** Every kind a calendar drag source can carry — the `accept` every target declares. */
export const CAL_DRAG_KINDS = [calEventMoveKind, calEventResizeKind, calEventCreateKind];

export interface EventMoveDragData {
  eventId: EventId;
  /** Snapshot at drag start so the reducer can preserve duration. */
  anchorStart: number;
  anchorEnd: number;
  allDay: boolean;
  /**
   * How far (ms) the grabbed chip's top sits past the event's start, non-zero
   * only for a segment of an event that crosses midnight. The within-chip grab
   * offset is the engine's: `getSnappedLocalPoint({ anchor: 'source' })`
   * reports where the chip's top edge lands, already on-grid.
   */
  segmentOffsetMs: number;
}

export interface EventResizeDragData {
  eventId: EventId;
  edge: 'start' | 'end';
  anchorStart: number;
  anchorEnd: number;
  allDay: boolean;
}

export interface EventCreateDragData {
  /** Where the create gesture began (ms). For all-day, day-aligned. */
  anchorMs: number;
  allDay: boolean;
}

export interface DayCellDropData {
  /** Start-of-day ms timestamp for the cell. */
  dayMs: number;
}

export interface DayColumnDropData {
  dayMs: number;
}

export interface AllDayRowDropData {
  dayMs: number;
}

export type CalendarDragSource = EventMoveDragData | EventResizeDragData | EventCreateDragData;
export type CalendarDropData = DayCellDropData | DayColumnDropData | AllDayRowDropData;

// -----------------------------------------------------------------------------
// Drop preview state (UI-only — drives ghost rendering during a drag)
// -----------------------------------------------------------------------------

export interface DropPreview {
  start: number;
  end: number;
  allDay: boolean;
  /** What the drop will actually do — informs the preview outline and label. */
  intent: 'move' | 'resize' | 'create';
  /**
   * For resize-only previews, which edge is being dragged. Lets the preview
   * draw the correct edge highlight and the reducer pick the right field.
   */
  edge?: 'start' | 'end';
}

// -----------------------------------------------------------------------------
// Reducer
// -----------------------------------------------------------------------------

export type CalendarAction =
  | { type: 'MOVE_EVENT'; id: EventId; newStart: number; newAllDay?: boolean }
  | { type: 'RESIZE_EVENT'; id: EventId; edge: 'start' | 'end'; newTime: number }
  | { type: 'CREATE_EVENT'; event: CalendarEvent }
  | { type: 'DELETE_EVENT'; id: EventId }
  | { type: 'UPDATE_EVENT'; id: EventId; patch: Partial<CalendarEvent> }
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
      const end = start + duration;
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
        // Round all-day end to next midnight so the duration stays day-aligned
        // and a same-day resize collapses to a single 24h span.
        nextEnd = event.allDay ? startOfDay(action.newTime) + DAY_MS : action.newTime;
      }
      // Clamp: if the dragged edge crossed the other one, swap so the event
      // stays valid (duration > 0). Resizing past the opposite edge "flips"
      // the gesture into shrinking from the other side.
      if (nextEnd <= nextStart) {
        if (event.allDay) {
          // Force a 1-day minimum for all-day events.
          if (action.edge === 'start') {
            nextStart = nextEnd - DAY_MS;
          } else {
            nextEnd = nextStart + DAY_MS;
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

    case 'DELETE_EVENT': {
      if (!state.events[action.id]) {
        return state;
      }
      const nextEvents = { ...state.events };
      delete nextEvents[action.id];
      return {
        events: nextEvents,
        order: state.order.filter((id) => id !== action.id),
      };
    }

    case 'UPDATE_EVENT': {
      const event = state.events[action.id];
      if (!event) {
        return state;
      }
      return {
        ...state,
        events: { ...state.events, [action.id]: { ...event, ...action.patch } },
      };
    }

    case 'RESET':
      return action.state;

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Date math
// -----------------------------------------------------------------------------

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
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

export function diffDays(aMs: number, bMs: number): number {
  return Math.round((startOfDay(aMs) - startOfDay(bMs)) / DAY_MS);
}

export function isSameDay(aMs: number, bMs: number): boolean {
  return startOfDay(aMs) === startOfDay(bMs);
}

export function clampToDay(ms: number, dayMs: number): number {
  const dayStart = startOfDay(dayMs);
  const dayEnd = dayStart + DAY_MS;
  return Math.max(dayStart, Math.min(dayEnd - MINUTE_MS, ms));
}

export function snapToMinutes(ms: number, stepMinutes: number): number {
  if (stepMinutes <= 0) {
    return ms;
  }
  const step = stepMinutes * MINUTE_MS;
  return Math.round(ms / step) * step;
}

/**
 * Builds a 6-row × 7-col grid covering `monthMs`'s month. Always returns
 * 42 cells so the height stays stable across months — months that fit in
 * 5 rows get a trailing week padded with the next month's first days, which
 * matches how most calendar UIs render.
 */
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

// -----------------------------------------------------------------------------
// Event utilities
// -----------------------------------------------------------------------------

/** Inclusive day count an event spans. A 1h event = 1, a 2-day event = 2. */
export function spanDays(event: { start: number; end: number; allDay: boolean }): number {
  if (event.allDay) {
    return Math.max(1, Math.round((event.end - event.start) / DAY_MS));
  }
  // Timed events: count distinct local-midnight boundaries crossed, +1.
  const startDay = startOfDay(event.start);
  // `end` is exclusive; subtract 1ms before computing the day so a midnight
  // boundary doesn't create a phantom extra day.
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

/**
 * Build a deterministic seed week of events anchored on `today`. Mixes
 * timed events of varying lengths, all-day events, and a multi-day event
 * to stress-test all four DnD operations at once.
 */
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

// -----------------------------------------------------------------------------
// Drop resolution
// -----------------------------------------------------------------------------

/**
 * Read the drop target the engine reports as innermost and turn it into a
 * concrete (start, end, allDay) suggestion the reducer can apply. No DOM
 * measurement and no rounding here: the day columns declare `snap`, so
 * `getSnappedLocalPoint` hands back an on-grid fraction from the rect the
 * engine measured to resolve the target.
 */
export function resolveDropPreview(
  source: DragSource<CalendarDragSource>,
  innermost: DropTargetRecord<CalendarDropData> | undefined,
): DropPreview | null {
  if (!innermost) {
    return null;
  }

  // Shared across kinds: the on-grid time under the pointer (or under the
  // grabbed chip's top edge, with the `'source'` anchor), capped so the last
  // slot of the day stays inside it.
  const timedMsAt = (dayMs: number, anchor?: 'source'): number => {
    const fraction = innermost.getSnappedLocalPoint({ anchor }).y;
    return Math.min(dayMs + DAY_MS - MINUTE_MS, dayMs + fraction * DAY_MS);
  };

  // The three drop payloads are structurally identical, so narrowing `innermost` to one
  // kind empties it for the later branches. Read the field they share once instead.
  const targetDayMs = innermost.payload.dayMs;

  if (calEventMoveKind.matches(source)) {
    const sourceData = source.payload;
    const duration = sourceData.anchorEnd - sourceData.anchorStart;
    if (calDayCellKind.matches(innermost)) {
      // Month view: keep the time-of-day, change the date.
      const dayMs = targetDayMs;
      const offset = sourceData.allDay
        ? 0
        : sourceData.anchorStart - startOfDay(sourceData.anchorStart);
      const start = dayMs + offset;
      return {
        start,
        end: start + duration,
        allDay: sourceData.allDay,
        intent: 'move',
      };
    }
    if (calAllDayRowKind.matches(innermost)) {
      const start = targetDayMs;
      return {
        start,
        end: start + Math.max(DAY_MS, duration),
        allDay: true,
        intent: 'move',
      };
    }
    if (calDayColumnKind.matches(innermost)) {
      // Week view: the source anchor reports where the chip's *top edge* lands,
      // already snapped, so the chip stays under the pointer instead of jumping
      // its top to the cursor.
      const start = timedMsAt(targetDayMs, 'source') - sourceData.segmentOffsetMs;
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
    const sourceData = source.payload;
    if (calDayCellKind.matches(innermost)) {
      // Month view resize: snap to whole-day end (start-of-day for start edge,
      // start-of-day + 24h for end edge — handled in the reducer).
      const time = targetDayMs;
      if (sourceData.edge === 'start') {
        const start = Math.min(time, sourceData.anchorEnd - DAY_MS);
        return {
          start,
          end: sourceData.anchorEnd,
          allDay: sourceData.allDay,
          intent: 'resize',
          edge: 'start',
        };
      }
      const end = Math.max(time + DAY_MS, sourceData.anchorStart + DAY_MS);
      return {
        start: sourceData.anchorStart,
        end,
        allDay: sourceData.allDay,
        intent: 'resize',
        edge: 'end',
      };
    }
    if (calAllDayRowKind.matches(innermost)) {
      const time = targetDayMs;
      if (sourceData.edge === 'start') {
        const start = Math.min(time, sourceData.anchorEnd - DAY_MS);
        return { start, end: sourceData.anchorEnd, allDay: true, intent: 'resize', edge: 'start' };
      }
      const end = Math.max(time + DAY_MS, sourceData.anchorStart + DAY_MS);
      return { start: sourceData.anchorStart, end, allDay: true, intent: 'resize', edge: 'end' };
    }
    if (calDayColumnKind.matches(innermost)) {
      const pointerMs = timedMsAt(targetDayMs);
      if (sourceData.edge === 'start') {
        const start = Math.min(pointerMs, sourceData.anchorEnd - MIN_TIMED_DURATION_MS);
        return {
          start,
          end: sourceData.anchorEnd,
          allDay: false,
          intent: 'resize',
          edge: 'start',
        };
      }
      const end = Math.max(pointerMs, sourceData.anchorStart + MIN_TIMED_DURATION_MS);
      return { start: sourceData.anchorStart, end, allDay: false, intent: 'resize', edge: 'end' };
    }
    return null;
  }

  if (calEventCreateKind.matches(source)) {
    const sourceData = source.payload;
    if (sourceData.allDay) {
      // Month view: pick whichever cell the pointer is over and span anchor → day.
      if (calDayCellKind.matches(innermost) || calAllDayRowKind.matches(innermost)) {
        const dayMs = targetDayMs;
        const lo = Math.min(sourceData.anchorMs, dayMs);
        const hi = Math.max(sourceData.anchorMs, dayMs);
        return {
          start: lo,
          end: hi + DAY_MS,
          allDay: true,
          intent: 'create',
        };
      }
      return null;
    }
    // Timed create: anchor in one column, drop in any column. Both ends are
    // already on-grid (the anchor was snapped at gesture start, the pointer by
    // the column's `snap`), so no re-rounding here.
    if (calDayColumnKind.matches(innermost)) {
      const pointerMs = timedMsAt(targetDayMs);
      const lo = Math.min(sourceData.anchorMs, pointerMs);
      const hi = Math.max(sourceData.anchorMs, pointerMs);
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

// -----------------------------------------------------------------------------
// Month-view track layout
// -----------------------------------------------------------------------------

export interface WeekEventSegment {
  eventId: EventId;
  /** 0–6 column where the bar starts within the week row. */
  startCol: number;
  /** 1–7 number of columns the bar spans. */
  span: number;
  /** Track index (vertical row inside the week). */
  track: number;
  /** Continues from previous week. */
  continuesFromBefore: boolean;
  /** Continues into next week. */
  continuesAfter: boolean;
}

/**
 * Greedy track assignment: events sorted by (start, -duration) get the lowest
 * available track. One pass per week so cross-week multi-day events occupy the
 * same track in each week — looks visually continuous.
 */
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

  const tracks: { eventId: EventId; endCol: number }[] = [];
  const segments: WeekEventSegment[] = [];

  for (const event of visible) {
    const startMs = Math.max(event.start, weekStartMs);
    const endMs = Math.min(event.end, weekEndMs);
    const startCol = Math.max(0, Math.min(6, diffDays(startMs, weekStartMs)));
    // For all-day, end is exclusive midnight. For timed, count by
    // last-day-with-content using `end - 1ms`.
    const lastDay = event.allDay
      ? diffDays(endMs - 1, weekStartMs)
      : diffDays(endMs - 1, weekStartMs);
    const endCol = Math.max(startCol, Math.min(6, lastDay));
    const span = endCol - startCol + 1;

    let track = tracks.findIndex((t) => t.endCol < startCol);
    if (track === -1) {
      track = tracks.length;
      tracks.push({ eventId: event.id, endCol });
    } else {
      tracks[track] = { eventId: event.id, endCol };
    }

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

// -----------------------------------------------------------------------------
// View-shared context (drag UI + view config)
// -----------------------------------------------------------------------------

export interface CalendarViewContextValue {
  events: CalendarEvent[];
  eventsRef: React.RefObject<CalendarEvent[]>;
  dispatch: React.Dispatch<CalendarAction>;
  /** Snap granularity in minutes, applied to timed drags. */
  snapMinutes: number;
  weekStartsOn: 0 | 1;
  /** Pixels per hour in the week view. Constant for now. */
  hourPx: number;
  /**
   * Captured at the experiment's mount so render code can compare without
   * calling `Date.now()` (flagged as impure). Updates on Reset.
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

// -----------------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------------

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
    const days = Math.max(1, Math.round((endMs - startMs) / DAY_MS));
    if (days === 1) {
      return RANGE_FORMATTER.format(startMs);
    }
    return `${RANGE_FORMATTER.format(startMs)} – ${RANGE_FORMATTER.format(endMs - DAY_MS)} (${days} days)`;
  }
  const sameDay = isSameDay(startMs, endMs - 1);
  if (sameDay) {
    return `${formatTime(startMs)} – ${formatTime(endMs)}`;
  }
  return `${RANGE_FORMATTER.format(startMs)} ${formatTime(startMs)} – ${RANGE_FORMATTER.format(endMs)} ${formatTime(endMs)}`;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / MINUTE_MS));
  if (totalMin >= 24 * 60) {
    const days = Math.round(ms / DAY_MS);
    return `${days}d`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}
