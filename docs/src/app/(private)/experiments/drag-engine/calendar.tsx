'use client';
import * as React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Toolbar } from '@base-ui/react/toolbar';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { Draggable } from '@base-ui/react/draggable';
import {
  addDays,
  addMonths,
  CAL_DRAG_KINDS,
  calendarReducer,
  CalendarEvent,
  CalendarViewMode,
  CalendarViewProvider,
  CalendarViewContextValue,
  createSeedState,
  DropPreview,
  startOfMonth,
  startOfWeek,
} from './calendarLogic';
import { CalendarMonthView } from './calendarViews/CalendarMonth';
import { CalendarWeekView } from './calendarViews/CalendarWeek';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import theme from './theme.module.css';
import styles from './calendar.module.css';

interface CalendarSettings {
  view: 'month' | 'week';
  weekStartsOnMonday: boolean;
  snapMinutes: number;
  hourPx: number;
}

export const settingsMetadata: SettingsMetadata<CalendarSettings> = {
  view: {
    type: 'string',
    label: 'View',
    options: ['month', 'week'],
    default: 'week',
  },
  weekStartsOnMonday: {
    type: 'boolean',
    label: 'Week starts on Monday',
    default: true,
  },
  snapMinutes: {
    type: 'number',
    label: 'Snap (minutes)',
    default: 15,
  },
  hourPx: {
    type: 'number',
    label: 'Hour height (px)',
    default: 48,
  },
};

const TITLE_FORMAT_MONTH = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const TITLE_FORMAT_WEEK_RANGE = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

function CalendarExperimentInner() {
  const { settings, setSettings } = useExperimentSettings<CalendarSettings>();
  const view: CalendarViewMode = settings.view === 'month' ? 'month' : 'week';
  const setView = useStableCallback((next: CalendarViewMode) => {
    setSettings((prev) => ({ ...prev, view: next }));
  });
  const weekStartsOn: 0 | 1 = settings.weekStartsOnMonday ? 1 : 0;
  const snapMin = Math.max(5, Math.floor(settings.snapMinutes || 15));
  const hourPx = Math.max(24, Math.floor(settings.hourPx || 48));

  const [state, dispatch] = React.useReducer(calendarReducer, undefined, () =>
    createSeedState(Date.now()),
  );
  const events = React.useMemo(
    () =>
      state.order
        .map((id) => state.events[id])
        .filter((event): event is CalendarEvent => event != null),
    [state],
  );
  const eventsRef = useValueAsRef(events);
  // Captured once so render code can compare without calling `Date.now()`
  // (flagged impure during render). Refreshed on Reset.
  const [todayMs, setTodayMs] = React.useState<number>(() => Date.now());

  // Anchor controls which month or week we're viewing. `today` resets it.
  const [anchorMs, setAnchorMs] = React.useState<number>(() => Date.now());

  const [dropPreview, setDropPreviewState] = React.useState<DropPreview | null>(null);
  const dropPreviewRef = useValueAsRef(dropPreview);
  const setDropPreview = useStableCallback((next: DropPreview | null) => {
    dropPreviewRef.current = next;
    setDropPreviewState(next);
  });
  const consumeDropPreview = useStableCallback(() => {
    const preview = dropPreviewRef.current;
    setDropPreview(null);
    return preview;
  });

  // Clear preview when a calendar drag ends so a cancelled drag doesn't leave a
  // ghost behind. This container isn't itself a draggable, so read the active
  // source from the provider-free `Draggable.useActiveDrag` (works outside a
  // `Draggable.PreviewProvider`, as this component is) and check it carries a calendar kind.
  const dragSource = Draggable.useActiveDrag();
  const isCalendarDragging =
    dragSource != null &&
    typeof dragSource.kind === 'string' &&
    CAL_DRAG_KINDS.some((kind) => kind.matches(dragSource));
  React.useEffect(() => {
    if (!isCalendarDragging) {
      setDropPreview(null);
    }
  }, [isCalendarDragging, setDropPreview]);

  const contextValue = React.useMemo<CalendarViewContextValue>(
    () => ({
      events,
      eventsRef,
      dispatch,
      snapMinutes: snapMin,
      weekStartsOn,
      hourPx,
      todayMs,
      dropPreview,
      setDropPreview,
      consumeDropPreview,
      dropPreviewRef,
    }),
    [
      events,
      eventsRef,
      snapMin,
      weekStartsOn,
      hourPx,
      todayMs,
      dropPreview,
      setDropPreview,
      consumeDropPreview,
      dropPreviewRef,
    ],
  );

  const handlePrev = useStableCallback(() => {
    if (view === 'month') {
      setAnchorMs((ms) => addMonths(ms, -1));
    } else {
      setAnchorMs((ms) => addDays(ms, -7));
    }
  });
  const handleNext = useStableCallback(() => {
    if (view === 'month') {
      setAnchorMs((ms) => addMonths(ms, 1));
    } else {
      setAnchorMs((ms) => addDays(ms, 7));
    }
  });
  const handleToday = useStableCallback(() => {
    const now = Date.now();
    setTodayMs(now);
    setAnchorMs(now);
  });
  const handleReset = useStableCallback(() => {
    const now = Date.now();
    setTodayMs(now);
    setAnchorMs(now);
    dispatch({ type: 'RESET', state: createSeedState(now) });
  });

  const monthMs = view === 'month' ? startOfMonth(anchorMs) : anchorMs;
  const weekStartMs = startOfWeek(anchorMs, weekStartsOn);

  let title: string;
  if (view === 'month') {
    title = TITLE_FORMAT_MONTH.format(monthMs);
  } else {
    const end = addDays(weekStartMs, 6);
    title = `${TITLE_FORMAT_WEEK_RANGE.format(weekStartMs)} – ${TITLE_FORMAT_WEEK_RANGE.format(end)}`;
  }

  return (
    <CalendarViewProvider value={contextValue}>
      <div className={clsx(theme.tokens, styles.root)}>
        <Toolbar.Root className={styles.toolbar}>
          <span className={styles.toolbarTitle}>Calendar</span>
          <div className={styles.viewSwitcher}>
            <Toolbar.Button
              render={
                <button
                  type="button"
                  className={clsx(styles.iconButton)}
                  data-active={view === 'month' ? 'true' : undefined}
                  aria-pressed={view === 'month'}
                  onClick={() => setView('month')}
                >
                  Month
                </button>
              }
            />
            <Toolbar.Button
              render={
                <button
                  type="button"
                  className={clsx(styles.iconButton)}
                  data-active={view === 'week' ? 'true' : undefined}
                  aria-pressed={view === 'week'}
                  onClick={() => setView('week')}
                >
                  Week
                </button>
              }
            />
          </div>
          <Toolbar.Button
            render={
              <button type="button" className={styles.iconButton} onClick={handlePrev}>
                <ChevronLeft size={14} aria-hidden /> Prev
              </button>
            }
          />
          <Toolbar.Button
            render={
              <button type="button" className={styles.iconButton} onClick={handleToday}>
                Today
              </button>
            }
          />
          <Toolbar.Button
            render={
              <button type="button" className={styles.iconButton} onClick={handleNext}>
                Next <ChevronRight size={14} aria-hidden />
              </button>
            }
          />
          <span className={styles.titleLabel}>{title}</span>
          <span className={styles.toolbarHint}>
            Drag to reschedule · Drag edge to resize · Drag empty space to create
          </span>
          <div className={styles.toolbarSpacer} />
          <Toolbar.Button
            render={
              <button type="button" className={styles.iconButton} onClick={handleReset}>
                <RotateCcw size={14} aria-hidden /> Reset
              </button>
            }
          />
        </Toolbar.Root>
        <div className={styles.main}>
          <div className={styles.view}>
            <Draggable.PreviewProvider>
              {view === 'month' ? (
                <CalendarMonthView monthMs={monthMs} />
              ) : (
                <CalendarWeekView weekStartMs={weekStartMs} />
              )}
            </Draggable.PreviewProvider>
          </div>
        </div>
      </div>
    </CalendarViewProvider>
  );
}

export default function CalendarExperiment() {
  return <CalendarExperimentInner />;
}
