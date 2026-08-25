'use client';
import * as React from 'react';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import {
  buildMonthGrid,
  calDayCellKind,
  CAL_DRAG_KINDS,
  calEventCreateKind,
  calEventMoveKind,
  calEventResizeKind,
  CalendarEvent,
  DAY_MS,
  DayCellDropData,
  diffDays,
  formatRange,
  isSameDay,
  layoutWeekSegments,
  resolveDropPreview,
  startOfDay,
  startOfMonth,
  useCalendarView,
  WeekEventSegment,
} from '../calendarLogic';
import styles from '../calendar.module.css';

const WEEKDAY_NAMES_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView(props: { monthMs: number }) {
  const { monthMs } = props;
  const { events, weekStartsOn } = useCalendarView();
  const monthStart = React.useMemo(() => startOfMonth(monthMs), [monthMs]);
  const days = React.useMemo(() => buildMonthGrid(monthMs, weekStartsOn), [monthMs, weekStartsOn]);
  const weeks = React.useMemo(() => {
    const result: number[][] = [];
    for (let i = 0; i < 6; i += 1) {
      result.push(days.slice(i * 7, i * 7 + 7));
    }
    return result;
  }, [days]);

  const dayLabels = weekStartsOn === 1 ? WEEKDAY_NAMES_MON : WEEKDAY_NAMES_SUN;

  return (
    <div className={styles.monthGrid}>
      <div className={styles.monthHeaderRow}>
        {dayLabels.map((label) => (
          <div key={label} className={styles.monthHeaderCell}>
            {label}
          </div>
        ))}
      </div>
      <div className={styles.monthBody}>
        {weeks.map((week) => (
          <MonthWeekRow
            key={week[0]}
            weekStartMs={week[0]}
            monthStart={monthStart}
            events={events}
          />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Week row
// -----------------------------------------------------------------------------

function MonthWeekRow(props: { weekStartMs: number; monthStart: number; events: CalendarEvent[] }) {
  const { weekStartMs, monthStart, events } = props;
  const { dropPreview } = useCalendarView();

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

  const previewSegment = React.useMemo(() => {
    if (!dropPreview) {
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

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStartMs + i * DAY_MS),
    [weekStartMs],
  );

  // Reserve at least one track of vertical room so the preview ghost has
  // somewhere to render even on a week with no real events.
  const segmentTracks = segments.length > 0 ? Math.max(...segments.map((s) => s.track)) + 1 : 0;
  const previewRow = previewSegment ? segmentTracks + 1 : null;

  return (
    <div className={styles.monthWeekRow}>
      {days.map((dayMs) => (
        <MonthDayCell key={dayMs} dayMs={dayMs} monthStart={monthStart} />
      ))}
      <div className={styles.monthEventsOverlay} aria-hidden="true">
        {segments.map((seg) => {
          const event = eventsById.get(seg.eventId);
          if (!event) {
            return null;
          }
          return (
            <MonthEventBar key={`${seg.eventId}-${seg.startCol}`} event={event} segment={seg} />
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
  );
}

// -----------------------------------------------------------------------------
// Day cell — drop target + draggable for create
// -----------------------------------------------------------------------------

function MonthDayCell(props: { dayMs: number; monthStart: number }) {
  const { dayMs, monthStart } = props;
  const { dispatch, dropPreviewRef, setDropPreview, consumeDropPreview, todayMs } =
    useCalendarView();
  const dayMsRef = useValueAsRef(dayMs);

  const today = isSameDay(dayMs, todayMs);
  const inMonth =
    startOfDay(dayMs) >= monthStart && startOfDay(dayMs) < startOfMonth(monthStart + 32 * DAY_MS);
  const dayNum = new Date(dayMs).getDate();

  // The cell is both a draggable (for create) and a drop target (for any
  // calendar drag landing on it). The two registrations live on the same
  // element; drag activation falls through to the cell only when the
  // pointerdown didn't land on a child draggable (e.g. an event bar).
  return (
    <Draggable.Root
      kind={calEventCreateKind}
      payload={{
        anchorMs: dayMsRef.current,
        allDay: true,
      }}
      // Month cells accept all calendar drag kinds; `accept` declares them
      // once and the engine filters before any callback fires.
      render={
        <DropTarget.Root
          kind={calDayCellKind}
          accept={CAL_DRAG_KINDS}
          getPayload={(): DayCellDropData => ({
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
        // The reducer assigns an id; we hand the engine an event template.
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
      className={styles.monthDayCell}
      data-cal-day
      data-today={today ? 'true' : undefined}
      data-outside={inMonth ? undefined : 'true'}
    >
      <span className={styles.monthDayHeader}>{dayNum}</span>
      {/* Nothing should follow the pointer while dragging out a new event: the day
          cell is the drag source, and a clone of it would be an enormous preview.
          The in-grid drop preview already shows the range being created. */}
      <Draggable.ClonedPreview disabled />
    </Draggable.Root>
  );
}

// -----------------------------------------------------------------------------
// Event bar — draggable for move + contains start/end resize handles
// -----------------------------------------------------------------------------

function MonthEventBar(props: { event: CalendarEvent; segment: WeekEventSegment }) {
  const { event, segment } = props;
  const { dispatch, consumeDropPreview } = useCalendarView();
  const eventRef = useValueAsRef(event);

  const inMonth = !segment.continuesFromBefore;
  const showRightResize = !segment.continuesAfter;
  const showLeftResize = !segment.continuesFromBefore;

  const style: React.CSSProperties = {
    gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
    gridRow: segment.track + 1,
  };

  const showTime = !event.allDay && inMonth;

  return (
    <Draggable.Root
      kind={calEventMoveKind}
      // The day cells form a grid the default navigation already walks; the
      // preset removes the pixel-nudge fallback at the month's edges.

      payload={{
        eventId: eventRef.current.id,
        anchorStart: eventRef.current.start,
        anchorEnd: eventRef.current.end,
        allDay: eventRef.current.allDay,
        // Month view doesn't grab at a sub-day offset: drop targets always
        // realign the move to the day cell. Using 0 keeps `resolveDropPreview`
        // consistent without month-specific branching.
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
      style={style}
      role="button"
      tabIndex={0}
      data-continues-before={segment.continuesFromBefore ? 'true' : undefined}
      data-continues-after={segment.continuesAfter ? 'true' : undefined}
      title={`${event.title} · ${formatRange(event.start, event.end, event.allDay)}`}
    >
      {/* Renders nothing here: the card is published to the `Draggable.PreviewProvider` and
          shown there instead of the default clone of the bar. */}
      <Draggable.Preview offset="pointer">
        <div className={styles.dragPreview}>
          <div className={styles.dragPreviewTitle}>{event.title}</div>
          <div className={styles.dragPreviewMeta}>
            {formatRange(event.start, event.end, event.allDay)}
          </div>
        </div>
      </Draggable.Preview>
      {showLeftResize && <MonthResizeHandle event={event} edge="start" />}
      <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {showTime && (
          <span style={{ opacity: 0.7, marginRight: 4 }}>
            {new Date(event.start).getHours().toString().padStart(2, '0')}:
            {new Date(event.start).getMinutes().toString().padStart(2, '0')}
          </span>
        )}
        {event.title}
      </span>
      {showRightResize && <MonthResizeHandle event={event} edge="end" />}
    </Draggable.Root>
  );
}

function MonthResizeHandle(props: { event: CalendarEvent; edge: 'start' | 'end' }) {
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
      className={styles.monthResizeHandle}
      style={edge === 'start' ? { left: 0, right: 'auto' } : undefined}
      aria-hidden="true"
    >
      {/* The source is a few pixels wide, so anchoring the info card to it would
          strand the card at the handle's corner: hang it off the pointer instead. */}
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
