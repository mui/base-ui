'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import {
  AllDayRowDropData,
  buildWeekDays,
  calAllDayRowKind,
  calDayColumnKind,
  CAL_DRAG_KINDS,
  calEventCreateKind,
  calEventMoveKind,
  calEventResizeKind,
  CalendarEvent,
  DAY_MS,
  DayColumnDropData,
  diffDays,
  formatRange,
  formatTime,
  HOUR_MS,
  isSameDay,
  layoutWeekSegments,
  MINUTE_MS,
  resolveDropPreview,
  snapToMinutes,
  useCalendarView,
  WeekEventSegment,
} from '../calendarLogic';
import styles from '../calendar.module.css';

// -----------------------------------------------------------------------------

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWeekView(props: { weekStartMs: number }) {
  const { weekStartMs } = props;
  const { events, hourPx, todayMs } = useCalendarView();
  const days = React.useMemo(() => buildWeekDays(weekStartMs), [weekStartMs]);
  const allDayEvents = React.useMemo(() => events.filter((event) => event.allDay), [events]);
  const timedEvents = React.useMemo(() => events.filter((event) => !event.allDay), [events]);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll to ~7 AM on first mount of a week so the user lands on a useful
  // hour rather than midnight.
  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 7 * hourPx;
    }
  }, [weekStartMs, hourPx]);

  return (
    <div
      className={styles.weekShell}
      style={{ '--cal-hour-px': `${hourPx}px` } as React.CSSProperties}
    >
      <WeekHeader days={days} todayMs={todayMs} />
      <WeekAllDayRow days={days} events={allDayEvents} weekStartMs={weekStartMs} />
      <DragAutoScroll.Root allowedAxis="vertical" className={styles.weekScroll} ref={scrollRef}>
        <div className={styles.weekBody}>
          <WeekHourLabels />
          <div className={styles.weekColumns}>
            {days.map((dayMs) => (
              <WeekDayColumn key={dayMs} dayMs={dayMs} events={timedEvents} />
            ))}
          </div>
        </div>
      </DragAutoScroll.Root>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Header (day labels)
// -----------------------------------------------------------------------------

function WeekHeader(props: { days: number[]; todayMs: number }) {
  const { days, todayMs } = props;
  return (
    <div className={styles.weekHeader}>
      <div className={styles.weekHeaderGutter} />
      {days.map((dayMs) => {
        const date = new Date(dayMs);
        const today = isSameDay(dayMs, todayMs);
        return (
          <div
            key={dayMs}
            className={styles.weekHeaderCell}
            data-today={today ? 'true' : undefined}
          >
            <span className={styles.weekHeaderDayName}>{WEEKDAY_NAMES[date.getDay()]}</span>
            <span className={styles.weekHeaderDayNum}>{date.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// All-day row
// -----------------------------------------------------------------------------

function WeekAllDayRow(props: { days: number[]; events: CalendarEvent[]; weekStartMs: number }) {
  const { days, events, weekStartMs } = props;
  const segments = React.useMemo(
    () => layoutWeekSegments(events, weekStartMs),
    [events, weekStartMs],
  );
  const eventsById = React.useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const event of events) {
      map.set(event.id, event);
    }
    return map;
  }, [events]);

  const { dropPreview } = useCalendarView();
  const previewSegment = React.useMemo(() => {
    if (!dropPreview || !dropPreview.allDay) {
      return null;
    }
    const weekEnd = weekStartMs + 7 * DAY_MS;
    if (dropPreview.start >= weekEnd || dropPreview.end <= weekStartMs) {
      return null;
    }
    const startMs = Math.max(dropPreview.start, weekStartMs);
    const endMs = Math.min(dropPreview.end, weekEnd);
    const startCol = Math.max(0, Math.min(6, diffDays(startMs, weekStartMs)));
    const lastDay = diffDays(endMs - 1, weekStartMs);
    const endCol = Math.max(startCol, Math.min(6, lastDay));
    return { startCol, span: endCol - startCol + 1 };
  }, [dropPreview, weekStartMs]);

  const segmentTracks = segments.length > 0 ? Math.max(...segments.map((s) => s.track)) + 1 : 0;
  const previewRow = previewSegment ? segmentTracks + 1 : null;
  const trackCount = Math.max(1, segmentTracks + (previewRow ? 1 : 0));

  return (
    <div
      className={styles.weekAllDayRow}
      style={{ minHeight: `${Math.max(32, trackCount * 24 + 8)}px` }}
    >
      <div className={styles.weekAllDayLabel}>all-day</div>
      <div className={styles.weekAllDayCells}>
        {days.map((dayMs) => (
          <WeekAllDayCell key={dayMs} dayMs={dayMs} />
        ))}
        <div className={styles.weekAllDayBars} aria-hidden="true">
          {segments.map((seg) => {
            const event = eventsById.get(seg.eventId);
            if (!event) {
              return null;
            }
            return (
              <WeekAllDayBar key={`${seg.eventId}-${seg.startCol}`} event={event} segment={seg} />
            );
          })}
          {previewSegment && dropPreview && previewRow != null && (
            <div
              className={styles.monthDropPreview}
              data-intent={dropPreview.intent}
              style={{
                gridColumn: `${previewSegment.startCol + 1} / span ${previewSegment.span}`,
                gridRow: previewRow,
              }}
            >
              {dropPreview.intent === 'create' ? 'New event · ' : ''}
              {formatRange(dropPreview.start, dropPreview.end, dropPreview.allDay)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekAllDayCell(props: { dayMs: number }) {
  const { dayMs } = props;
  const { dispatch, dropPreviewRef, setDropPreview, consumeDropPreview } = useCalendarView();
  const dayMsRef = useValueAsRef(dayMs);

  return (
    <Draggable.Root
      kind={calEventCreateKind}
      payload={{
        anchorMs: dayMsRef.current,
        allDay: true,
      }}
      render={
        <DropTarget.Root
          kind={calAllDayRowKind}
          accept={CAL_DRAG_KINDS}
          getPayload={(): AllDayRowDropData => ({
            dayMs: dayMsRef.current,
          })}
          onDrag={({ source, self }) => {
            const next = resolveDropPreview(source, self);
            if (!next) {
              return;
            }
            const current = dropPreviewRef.current;
            if (
              !current ||
              current.start !== next.start ||
              current.end !== next.end ||
              current.intent !== next.intent ||
              current.allDay !== next.allDay
            ) {
              setDropPreview(next);
            }
          }}
        />
      }
      onDrop={() => {
        const preview = consumeDropPreview();
        if (preview?.intent !== 'create') {
          return;
        }
        dispatch({
          type: 'CREATE_EVENT',
          event: {
            id: `evt-create-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: 'New event',
            start: preview.start,
            end: preview.end,
            allDay: preview.allDay,
          },
        });
      }}
      className={styles.weekAllDayCell}
      data-cal-allday-cell
    >
      {/* The drag source is the all-day cell itself; a clone of it would be a
          full-width preview. The in-grid drop preview shows the range being created. */}
      <Draggable.ClonedPreview disabled />
    </Draggable.Root>
  );
}

function WeekAllDayBar(props: { event: CalendarEvent; segment: WeekEventSegment }) {
  const { event, segment } = props;
  const { dispatch, consumeDropPreview } = useCalendarView();
  const eventRef = useValueAsRef(event);

  return (
    <Draggable.Root
      kind={calEventMoveKind}
      // An all-day bar only moves between days: ←/→ snap to the adjacent cell,
      // vertical arrows do nothing (the timed grid refuses all-day drags).

      payload={{
        eventId: eventRef.current.id,
        anchorStart: eventRef.current.start,
        anchorEnd: eventRef.current.end,
        allDay: eventRef.current.allDay,
        segmentOffsetMs: 0,
      }}
      onDrop={() => {
        const preview = consumeDropPreview();
        if (preview?.intent !== 'move') {
          return;
        }
        dispatch({
          type: 'MOVE_EVENT',
          id: eventRef.current.id,
          newStart: preview.start,
          newAllDay: preview.allDay,
        });
      }}
      className={styles.monthEventBar}
      style={{
        gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
        gridRow: segment.track + 1,
      }}
      role="button"
      tabIndex={0}
      data-continues-before={segment.continuesFromBefore ? 'true' : undefined}
      data-continues-after={segment.continuesAfter ? 'true' : undefined}
      title={`${event.title} · ${formatRange(event.start, event.end, event.allDay)}`}
    >
      <Draggable.Preview offset="pointer">
        <div className={styles.dragPreview}>
          <div className={styles.dragPreviewTitle}>{event.title}</div>
          <div className={styles.dragPreviewMeta}>
            {formatRange(event.start, event.end, event.allDay)}
          </div>
        </div>
      </Draggable.Preview>
      {event.title}
    </Draggable.Root>
  );
}

// -----------------------------------------------------------------------------
// Hour labels
// -----------------------------------------------------------------------------

function WeekHourLabels() {
  const labels: React.ReactNode[] = [];
  for (let h = 0; h < 24; h += 1) {
    labels.push(
      <div key={h} className={styles.weekHourLabel}>
        {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
      </div>,
    );
  }
  return <div className={styles.weekHourLabels}>{labels}</div>;
}

// -----------------------------------------------------------------------------
// Day column (drop target + create draggable + renders timed events)
// -----------------------------------------------------------------------------

interface TimedSegment {
  event: CalendarEvent;
  visibleStart: number;
  visibleEnd: number;
  isStartSegment: boolean;
  isEndSegment: boolean;
}

function getDayTimedSegments(events: CalendarEvent[], dayMs: number): TimedSegment[] {
  const dayEnd = dayMs + DAY_MS;
  const result: TimedSegment[] = [];
  for (const event of events) {
    if (event.start >= dayEnd || event.end <= dayMs) {
      continue;
    }
    result.push({
      event,
      visibleStart: Math.max(event.start, dayMs),
      visibleEnd: Math.min(event.end, dayEnd),
      isStartSegment: event.start >= dayMs,
      isEndSegment: event.end <= dayEnd,
    });
  }
  return result;
}

function WeekDayColumn(props: { dayMs: number; events: CalendarEvent[] }) {
  const { dayMs, events } = props;
  const {
    dispatch,
    snapMinutes: snapMin,
    hourPx,
    dropPreview,
    dropPreviewRef,
    setDropPreview,
    consumeDropPreview,
  } = useCalendarView();
  const dayMsRef = useValueAsRef(dayMs);
  const hourPxRef = useValueAsRef(hourPx);
  const snapRef = useValueAsRef(snapMin);

  const segments = React.useMemo(() => getDayTimedSegments(events, dayMs), [events, dayMs]);

  // Compute timed drop preview for this column (if intersecting).
  const previewBlock = React.useMemo(() => {
    if (!dropPreview || dropPreview.allDay) {
      return null;
    }
    const dayEnd = dayMs + DAY_MS;
    if (dropPreview.start >= dayEnd || dropPreview.end <= dayMs) {
      return null;
    }
    const visibleStart = Math.max(dropPreview.start, dayMs);
    const visibleEnd = Math.min(dropPreview.end, dayEnd);
    return {
      top: ((visibleStart - dayMs) / HOUR_MS) * hourPx,
      height: Math.max(8, ((visibleEnd - visibleStart) / HOUR_MS) * hourPx),
    };
  }, [dropPreview, dayMs, hourPx]);

  return (
    <Draggable.Root
      kind={calEventCreateKind}
      render={
        <DropTarget.Root
          kind={calDayColumnKind}
          accept={CAL_DRAG_KINDS}
          getPayload={(): DayColumnDropData => ({
            dayMs: dayMsRef.current,
          })}
          canDrop={({ source }) => {
            // Don't accept all-day-only drags here — they belong in the all-day row.
            return !source.payload.allDay;
          }}
          // One day divides into `DAY_MS / snap` slots; a callback because the
          // snap setting is runtime state.
          snap={() => ({ y: DAY_MS / (snapRef.current * MINUTE_MS) })}
          onDrag={({ source, self }) => {
            const next = resolveDropPreview(source, self);
            if (!next) {
              return;
            }
            const current = dropPreviewRef.current;
            if (
              !current ||
              current.start !== next.start ||
              current.end !== next.end ||
              current.intent !== next.intent ||
              current.allDay !== next.allDay
            ) {
              setDropPreview(next);
            }
          }}
        />
      }
      getPayload={({ input, element }) => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        const offsetPx = input.clientY - rect.top;
        const rawMs = dayMsRef.current + offsetPx * (HOUR_MS / hourPxRef.current);
        const snapped = snapToMinutes(rawMs, snapRef.current);
        return {
          anchorMs: Math.max(
            dayMsRef.current,
            Math.min(dayMsRef.current + DAY_MS - MINUTE_MS, snapped),
          ),
          allDay: false,
        };
      }}
      onDrop={() => {
        const preview = consumeDropPreview();
        if (preview?.intent !== 'create') {
          return;
        }
        dispatch({
          type: 'CREATE_EVENT',
          event: {
            id: `evt-create-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: 'New event',
            start: preview.start,
            end: preview.end,
            allDay: preview.allDay,
          },
        });
      }}
      className={styles.weekColumn}
      data-cal-day-column
    >
      <Draggable.Preview offset="pointer">
        <div className={styles.dragPreview}>
          <div className={styles.dragPreviewTitle}>New event</div>
        </div>
      </Draggable.Preview>
      {segments.map((seg) => (
        <WeekTimedEvent key={`${seg.event.id}-${seg.visibleStart}`} dayMs={dayMs} segment={seg} />
      ))}
      {previewBlock && dropPreview && (
        <div
          className={styles.weekDropPreview}
          data-intent={dropPreview.intent}
          style={{ top: previewBlock.top, height: previewBlock.height }}
        >
          {dropPreview.intent === 'create' ? 'New event' : ''}
          <div className={styles.weekEventTime}>
            {formatTime(dropPreview.start)} – {formatTime(dropPreview.end)}
          </div>
        </div>
      )}
    </Draggable.Root>
  );
}

// -----------------------------------------------------------------------------
// Timed event chip
// -----------------------------------------------------------------------------

function WeekTimedEvent(props: { dayMs: number; segment: TimedSegment }) {
  const { dayMs, segment } = props;
  const { event } = segment;
  const { dispatch, hourPx, consumeDropPreview } = useCalendarView();
  const eventRef = useValueAsRef(event);
  const top = ((segment.visibleStart - dayMs) / HOUR_MS) * hourPx;
  const height = Math.max(20, ((segment.visibleEnd - segment.visibleStart) / HOUR_MS) * hourPx);

  return (
    <Draggable.Root
      kind={calEventMoveKind}
      getPayload={() => ({
        eventId: eventRef.current.id,
        anchorStart: eventRef.current.start,
        anchorEnd: eventRef.current.end,
        allDay: eventRef.current.allDay,
        // The within-chip grab offset is the engine's (`anchor: 'source'`);
        // only the segment correction travels with the drag, non-zero for a
        // chip that renders the post-midnight part of an event.
        segmentOffsetMs: segment.visibleStart - eventRef.current.start,
      })}
      onDrop={() => {
        const preview = consumeDropPreview();
        if (preview?.intent !== 'move') {
          return;
        }
        dispatch({
          type: 'MOVE_EVENT',
          id: eventRef.current.id,
          newStart: preview.start,
          newAllDay: preview.allDay,
        });
      }}
      className={styles.weekEvent}
      style={{ top, height }}
      role="button"
      tabIndex={0}
      title={`${event.title} · ${formatRange(event.start, event.end, event.allDay)}`}
    >
      <Draggable.Preview offset="pointer">
        <div className={styles.dragPreview}>
          <div className={styles.dragPreviewTitle}>{event.title}</div>
          <div className={styles.dragPreviewMeta}>
            {formatRange(event.start, event.end, event.allDay)}
          </div>
        </div>
      </Draggable.Preview>
      {segment.isStartSegment && <WeekResizeHandle event={event} edge="start" />}
      <div className={styles.weekEventTitle}>{event.title}</div>
      <div className={styles.weekEventTime}>
        {formatTime(event.start)} – {formatTime(event.end)}
      </div>
      {segment.isEndSegment && <WeekResizeHandle event={event} edge="end" />}
    </Draggable.Root>
  );
}

function WeekResizeHandle(props: { event: CalendarEvent; edge: 'start' | 'end' }) {
  const { event, edge } = props;
  const { dispatch, consumeDropPreview } = useCalendarView();
  const eventRef = useValueAsRef(event);

  return (
    <Draggable.Root
      render={<span />}
      kind={calEventResizeKind}
      // The handle is `aria-hidden`; without this it would still get
      // `tabIndex={0}` — focusable but invisible to screen readers.

      payload={{
        eventId: eventRef.current.id,
        edge,
        anchorStart: eventRef.current.start,
        anchorEnd: eventRef.current.end,
        allDay: eventRef.current.allDay,
      }}
      onDrop={() => {
        const preview = consumeDropPreview();
        if (preview?.intent !== 'resize') {
          return;
        }
        dispatch({
          type: 'RESIZE_EVENT',
          id: eventRef.current.id,
          edge,
          newTime: edge === 'start' ? preview.start : preview.end,
        });
      }}
      className={edge === 'start' ? styles.weekResizeTop : styles.weekResizeBottom}
      aria-hidden="true"
    >
      <Draggable.Preview offset="pointer">
        <div className={styles.dragPreview} data-intent="resize">
          <div className={styles.dragPreviewTitle}>{event.title}</div>
          <div className={styles.dragPreviewMeta}>
            {edge === 'start' ? 'Resize start' : 'Resize end'}
          </div>
        </div>
      </Draggable.Preview>
    </Draggable.Root>
  );
}
