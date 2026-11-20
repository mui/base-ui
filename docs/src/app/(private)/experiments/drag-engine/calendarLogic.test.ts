import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Draggable } from '@base-ui/react/draggable';
import {
  addDays,
  addMonths,
  calDayCellKind,
  calEventCreateKind,
  calEventResizeKind,
  calendarReducer,
  layoutWeekSegments,
  resolveDropPreview,
} from './calendarLogic';
import type { CalendarDragSource, CalendarDropPayload, CalendarEvent } from './calendarLogic';

function day(year: number, month: number, date: number) {
  return new Date(year, month - 1, date).getTime();
}

function target(dayMs: number) {
  return {
    kind: calDayCellKind.id,
    payload: { dayMs },
  } as Draggable.Target.Record<CalendarDropPayload>;
}

afterEach(() => vi.unstubAllEnvs());

describe('calendar date changes', () => {
  it('navigates into shorter months without skipping them', () => {
    expect(addMonths(day(2026, 1, 31), 1)).toBe(day(2026, 2, 28));
    expect(addMonths(day(2026, 3, 31), -1)).toBe(day(2026, 2, 28));
    expect(addMonths(day(2024, 1, 31), 1)).toBe(day(2024, 2, 29));
  });

  it('commits exactly the exclusive end shown by the all-day resize preview', () => {
    const event: CalendarEvent = {
      id: 'event',
      title: 'Event',
      allDay: true,
      start: day(2026, 1, 10),
      end: day(2026, 1, 11),
    };
    const source = {
      kind: calEventResizeKind.id,
      payload: {
        eventId: event.id,
        edge: 'end',
        allDay: true,
        anchorStart: event.start,
        anchorEnd: event.end,
      },
    } as Draggable.Root.Record<CalendarDragSource>;
    const preview = resolveDropPreview(source, target(day(2026, 1, 12)))!;
    const state = calendarReducer(
      { events: { event }, order: ['event'] },
      {
        type: 'RESIZE_EVENT',
        id: 'event',
        edge: 'end',
        newTime: preview.end,
      },
    );
    expect(preview.end).toBe(day(2026, 1, 13));
    expect(state.events.event.end).toBe(preview.end);
  });

  it.each([
    [2026, 3, 29],
    [2026, 10, 25],
  ])(
    'keeps all-day creation and movement at local midnight across %s-%s-%s',
    (year, month, date) => {
      vi.stubEnv('TZ', 'Europe/Paris');
      const start = day(year, month, date);
      const source = {
        kind: calEventCreateKind.id,
        payload: { anchorMs: start, allDay: true },
      } as Draggable.Root.Record<CalendarDragSource>;
      const preview = resolveDropPreview(source, target(start))!;
      expect(preview.end).toBe(day(year, month, date + 1));
      expect(new Date(preview.end).getHours()).toBe(0);
      expect((preview.end - start) / 3_600_000).toBe(month === 3 ? 23 : 25);
      const event: CalendarEvent = {
        id: 'event',
        title: 'Event',
        start,
        end: preview.end,
        allDay: true,
      };
      const state = calendarReducer(
        { events: { event }, order: ['event'] },
        {
          type: 'MOVE_EVENT',
          id: 'event',
          newStart: addDays(start, 1),
        },
      );
      expect(state.events.event.end).toBe(addDays(start, 2));
      expect(layoutWeekSegments([event], start)[0].span).toBe(1);
    },
  );
});
