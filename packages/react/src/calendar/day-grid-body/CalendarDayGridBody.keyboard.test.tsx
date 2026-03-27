import * as React from 'react';
import { vi } from 'vitest';
import { Calendar } from '@base-ui/react/calendar';
import type { CalendarRoot } from '@base-ui/react/calendar';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createTemporalRenderer, isJSDOM } from '#test-utils';

describe('<Calendar.DayGridBody /> - keyboard navigation', () => {
  const { render, adapter } = createTemporalRenderer();

  function getAnimatedViewportStyles() {
    return `
      .animated-calendar-root {
        overflow: clip;
        height: 312px;
        display: flex;
        flex-direction: column;
      }

      .animated-calendar-header {
        box-sizing: border-box;
        padding: 8px 12px;
        height: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .animated-calendar-header-label-wrapper {
        width: 100%;
        display: grid;
        justify-content: center;
      }

      .animated-calendar-header-label {
        grid-row: 1;
        grid-column: 1;
        min-width: 185px;
        text-align: center;
        overflow: clip;
      }

      .animated-day-grid {
        padding: 12px;
        height: 276px;
        display: grid;
        grid-template-rows: min-content 1fr;
        grid-template-columns: 1fr;
        gap: 4px;
        position: relative;
      }

      .animated-day-grid-header-row,
      .animated-day-grid-row {
        display: flex;
        justify-content: center;
      }

      .animated-day-grid-header-cell,
      .animated-day-grid-cell {
        padding: 0;
        width: 36px;
        text-align: center;
      }

      .animated-day-button {
        height: 36px;
        width: 36px;
        padding: 0;
      }

      .animated-day-grid-body {
        display: flex;
        flex-direction: column;
        row-gap: 2px;
        grid-row: 2;
        grid-column: 1;
        transform: translateX(0);
        opacity: 1;
      }

      .animated-calendar-header-label[data-current],
      .animated-calendar-header-label[data-previous],
      .animated-day-grid-body[data-current],
      .animated-day-grid-body[data-previous] {
        transition:
          opacity 200ms linear,
          transform 200ms linear;
      }

      .animated-day-grid-body[data-navigation-direction='next'][data-previous][data-ending-style] {
        transform: translateX(-100%);
        opacity: 0;
      }

      .animated-day-grid-body[data-navigation-direction='next'][data-current][data-starting-style] {
        transform: translateX(100%);
        opacity: 0;
      }

      .animated-day-grid-body[data-navigation-direction='previous'][data-previous][data-ending-style] {
        transform: translateX(100%);
        opacity: 0;
      }

      .animated-day-grid-body[data-navigation-direction='previous'][data-current][data-starting-style] {
        transform: translateX(-100%);
        opacity: 0;
      }
    `;
  }

  function renderCalendar(
    defaultDate: ReturnType<ReturnType<typeof createTemporalRenderer>['adapter']['date']>,
    options?: {
      minDate?: ReturnType<ReturnType<typeof createTemporalRenderer>['adapter']['date']>;
      maxDate?: ReturnType<ReturnType<typeof createTemporalRenderer>['adapter']['date']>;
      onVisibleDateChange?: CalendarRoot.Props['onVisibleDateChange'];
      onValueChange?: CalendarRoot.Props['onValueChange'];
      focusableWhenDisabled?: boolean;
      offset?: number;
      withViewport?: boolean;
    },
  ) {
    const dayGridBody = (
      <Calendar.DayGridBody offset={options?.offset}>
        {(week) => (
          <Calendar.DayGridRow value={week} key={week.getTime()}>
            {(day) => (
              <Calendar.DayGridCell value={day} key={day.getTime()}>
                <Calendar.DayButton focusableWhenDisabled={options?.focusableWhenDisabled} />
              </Calendar.DayGridCell>
            )}
          </Calendar.DayGridRow>
        )}
      </Calendar.DayGridBody>
    );

    return render(
      <Calendar.Root
        defaultVisibleDate={defaultDate}
        onVisibleDateChange={options?.onVisibleDateChange}
        onValueChange={options?.onValueChange}
        minDate={options?.minDate}
        maxDate={options?.maxDate}
      >
        <Calendar.DayGrid>
          {options?.withViewport ? (
            <Calendar.Viewport>{dayGridBody}</Calendar.Viewport>
          ) : (
            dayGridBody
          )}
        </Calendar.DayGrid>
      </Calendar.Root>,
    );
  }

  /** Queries a day button by its full accessible name (e.g. "Saturday, February 15, 2025"). */
  function getDayButton(
    date: ReturnType<ReturnType<typeof createTemporalRenderer>['adapter']['date']>,
  ) {
    return screen.getByRole('button', {
      name: adapter.format(date, 'localizedDateWithFullMonthAndWeekDay'),
    });
  }

  // Common date constants
  const feb1 = adapter.date('2025-02-01', 'default');
  const feb8 = adapter.date('2025-02-08', 'default');
  const feb9 = adapter.date('2025-02-09', 'default');
  const feb14 = adapter.date('2025-02-14', 'default');
  const feb15 = adapter.date('2025-02-15', 'default');
  const feb16 = adapter.date('2025-02-16', 'default');
  const feb28 = adapter.date('2025-02-28', 'default');
  const mar31 = adapter.date('2025-03-31', 'default');
  const apr7 = adapter.date('2025-04-07', 'default');
  const jul25 = adapter.date('2021-07-25', 'default');
  const jul31 = adapter.date('2021-07-31', 'default');
  const aug1 = adapter.date('2021-08-01', 'default');
  const aug7 = adapter.date('2021-08-07', 'default');

  function renderAnimatedViewportCalendar(
    defaultDate: ReturnType<ReturnType<typeof createTemporalRenderer>['adapter']['date']>,
    options?: {
      onVisibleDateChange?: CalendarRoot.Props['onVisibleDateChange'];
    },
  ) {
    return render(
      <React.Fragment>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: getAnimatedViewportStyles() }} />
        <Calendar.Root
          className="animated-calendar-root"
          defaultVisibleDate={defaultDate}
          onVisibleDateChange={options?.onVisibleDateChange}
        >
          {({ visibleDate }) => (
            <React.Fragment>
              <header className="animated-calendar-header">
                <Calendar.DecrementMonth data-testid="previous-month">
                  Previous
                </Calendar.DecrementMonth>
                <div className="animated-calendar-header-label-wrapper">
                  <Calendar.Viewport>
                    <span className="animated-calendar-header-label">
                      {adapter.getMonth(visibleDate)}-{adapter.getYear(visibleDate)}
                    </span>
                  </Calendar.Viewport>
                </div>
                <Calendar.IncrementMonth data-testid="next-month">Next</Calendar.IncrementMonth>
              </header>
              <Calendar.DayGrid className="animated-day-grid">
                <Calendar.DayGridHeader>
                  <Calendar.DayGridHeaderRow className="animated-day-grid-header-row">
                    {(day) => (
                      <Calendar.DayGridHeaderCell
                        className="animated-day-grid-header-cell"
                        key={day.getTime()}
                        value={day}
                      />
                    )}
                  </Calendar.DayGridHeaderRow>
                </Calendar.DayGridHeader>
                <Calendar.Viewport>
                  <Calendar.DayGridBody className="animated-day-grid-body">
                    {(week) => (
                      <Calendar.DayGridRow
                        className="animated-day-grid-row"
                        key={week.getTime()}
                        value={week}
                      >
                        {(day) => (
                          <Calendar.DayGridCell
                            className="animated-day-grid-cell"
                            key={day.getTime()}
                            value={day}
                          >
                            <Calendar.DayButton className="animated-day-button" />
                          </Calendar.DayGridCell>
                        )}
                      </Calendar.DayGridRow>
                    )}
                  </Calendar.DayGridBody>
                </Calendar.Viewport>
              </Calendar.DayGrid>
            </React.Fragment>
          )}
        </Calendar.Root>
      </React.Fragment>,
    );
  }

  // ---------------------------------------------------------------------------
  // PageDown / PageUp
  // ---------------------------------------------------------------------------

  describe('PageDown', () => {
    it('should move focus to the same day in the next month when pressing PageDown', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(feb15, { onVisibleDateChange });

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, 1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });

    it('should find the nearest day to focus in the next month when same day does not exist', async () => {
      const jan31 = adapter.date('2025-01-31', 'default');
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(jan31, { onVisibleDateChange });

      await act(async () => {
        getDayButton(jan31).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(jan31, 1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });

    it('should preserve focus when wrapped in a viewport', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(feb15, { onVisibleDateChange, withViewport: true });

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, 1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });

    it('should preserve focus in controlled mode when wrapped in a viewport', async () => {
      const onVisibleDateChange = vi.fn();

      function ControlledCalendar() {
        const [visibleDate, setVisibleDate] = React.useState(feb15);

        return (
          <Calendar.Root
            visibleDate={visibleDate}
            onVisibleDateChange={(newVisibleDate, eventDetails) => {
              onVisibleDateChange(newVisibleDate, eventDetails);
              setVisibleDate(newVisibleDate);
            }}
          >
            <Calendar.DayGrid>
              <Calendar.Viewport>
                <Calendar.DayGridBody>
                  {(week) => (
                    <Calendar.DayGridRow value={week} key={week.getTime()}>
                      {(day) => (
                        <Calendar.DayGridCell value={day} key={day.getTime()}>
                          <Calendar.DayButton />
                        </Calendar.DayGridCell>
                      )}
                    </Calendar.DayGridRow>
                  )}
                </Calendar.DayGridBody>
              </Calendar.Viewport>
            </Calendar.DayGrid>
          </Calendar.Root>
        );
      }

      const { user } = render(<ControlledCalendar />);

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, 1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });

    it('should clear a rejected controlled focus request before a later external month change', async () => {
      const onVisibleDateChange = vi.fn();
      const marchMonth = adapter.startOfMonth(adapter.addMonths(feb15, 1));

      function ControlledCalendar() {
        const [visibleDate, setVisibleDate] = React.useState(feb15);

        return (
          <React.Fragment>
            <button type="button" onClick={() => setVisibleDate(marchMonth)}>
              Show March
            </button>
            <Calendar.Root
              visibleDate={visibleDate}
              onVisibleDateChange={(newVisibleDate, eventDetails) => {
                onVisibleDateChange(newVisibleDate, eventDetails);
              }}
            >
              <Calendar.DayGrid>
                <Calendar.Viewport>
                  <Calendar.DayGridBody>
                    {(week) => (
                      <Calendar.DayGridRow value={week} key={week.getTime()}>
                        {(day) => (
                          <Calendar.DayGridCell value={day} key={day.getTime()}>
                            <Calendar.DayButton />
                          </Calendar.DayGridCell>
                        )}
                      </Calendar.DayGridRow>
                    )}
                  </Calendar.DayGridBody>
                </Calendar.Viewport>
              </Calendar.DayGrid>
            </Calendar.Root>
          </React.Fragment>
        );
      }

      const { user } = render(<ControlledCalendar />);

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(marchMonth);
      expect(getDayButton(feb15)).toHaveFocus();

      const showMarchButton = screen.getByRole('button', { name: 'Show March' });
      await user.click(showMarchButton);

      expect(showMarchButton).toHaveFocus();
      expect(getDayButton(adapter.addMonths(feb15, 1))).not.toHaveFocus();
    });

    it('should preserve focus for offset day grids inside a viewport', async () => {
      const onVisibleDateChange = vi.fn();
      const may7 = adapter.date('2025-05-07', 'default');

      const { user } = renderCalendar(adapter.startOfMonth(mar31), {
        offset: 1,
        onVisibleDateChange,
        withViewport: true,
      });

      await act(async () => {
        getDayButton(apr7).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(apr7));
      expect(getDayButton(may7)).toHaveFocus();
    });

    describe.skipIf(isJSDOM)('animated viewport regressions', () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      });

      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it('should keep browser focus on the next month day when PageDown remounts an animated viewport', async () => {
        const onVisibleDateChange = vi.fn();
        const mar15Date2026 = adapter.date('2026-03-15', 'default');
        const apr15Date2026 = adapter.date('2026-04-15', 'default');

        const { user } = renderAnimatedViewportCalendar(mar15Date2026, {
          onVisibleDateChange,
        });

        await user.click(screen.getByTestId('next-month'));
        await waitFor(() => {
          expect(getDayButton(apr15Date2026)).toBeVisible();
        });

        await act(async () => {
          getDayButton(apr15Date2026).focus();
        });
        expect(getDayButton(apr15Date2026)).toHaveFocus();

        await user.keyboard('[PageDown]');

        const newDate = adapter.addMonths(apr15Date2026, 1);
        await waitFor(() => {
          expect(onVisibleDateChange.mock.calls.length).toBe(2);
          expect(onVisibleDateChange.mock.calls[1][0]).toEqual(adapter.startOfMonth(newDate));
          const rowgroups = screen.getAllByRole('rowgroup');
          expect(rowgroups).toHaveLength(1);
          expect(rowgroups[0]?.getAnimations().length).toBe(0);
        });
        expect(getDayButton(newDate)).toHaveFocus();
      });

      it('should keep browser focus on the previous month day when ArrowUp remounts an animated viewport', async () => {
        const onVisibleDateChange = vi.fn();
        const mar15Date2026 = adapter.date('2026-03-15', 'default');
        const apr7Date2026 = adapter.date('2026-04-07', 'default');
        const mar31Date2026 = adapter.date('2026-03-31', 'default');

        const { user } = renderAnimatedViewportCalendar(mar15Date2026, {
          onVisibleDateChange,
        });

        await user.click(screen.getByTestId('next-month'));
        await waitFor(() => {
          expect(getDayButton(apr7Date2026)).toBeVisible();
        });

        await act(async () => {
          getDayButton(apr7Date2026).focus();
        });
        expect(getDayButton(apr7Date2026)).toHaveFocus();

        await user.keyboard('{ArrowUp}');

        await waitFor(() => {
          expect(onVisibleDateChange.mock.calls.length).toBe(2);
          expect(onVisibleDateChange.mock.calls[1][0]).toEqual(adapter.startOfMonth(mar31Date2026));
          const rowgroups = screen.getAllByRole('rowgroup');
          expect(rowgroups).toHaveLength(1);
          expect(rowgroups[0]?.getAnimations().length).toBe(0);
        });
        expect(getDayButton(mar31Date2026)).toHaveFocus();
      });
    });
  });

  describe('PageUp', () => {
    it('should move focus to the same day in the previous month when pressing PageUp', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(feb15, { onVisibleDateChange });

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[PageUp]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, -1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });

    it('should find the nearest day to focus in the previous month when same day does not exist', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(mar31, { onVisibleDateChange });

      await act(async () => {
        getDayButton(mar31).focus();
      });
      await user.keyboard('[PageUp]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(mar31, -1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });
  });

  describe('Shift+PageDown', () => {
    it('should move focus to the same day 12 months forward when pressing Shift+PageDown', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(feb15, { onVisibleDateChange });

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[ShiftLeft>][PageDown][/ShiftLeft]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, 12);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });
  });

  describe('Shift+PageUp', () => {
    it('should move focus to the same day 12 months backward when pressing Shift+PageUp', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(feb15, { onVisibleDateChange });

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('[ShiftLeft>][PageUp][/ShiftLeft]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      const newDate = adapter.addMonths(feb15, -12);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(newDate));
      expect(getDayButton(newDate)).toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Arrow navigation - within the same month
  //
  // February 2025 grid (en-US locale, weeks start Sunday):
  //   Week 1: Jan 26(disabled) … Feb 1(Sat, index 6)
  //   Week 2: Feb 2(Sun) … Feb 8(Sat, index 13)
  //   Week 3: Feb 9(Sun) … Feb 15(Sat, index 20)
  //   Week 4: Feb 16(Sun) … Feb 22(Sat, index 27)
  //   Week 5: Feb 23(Sun) … Feb 28(Fri, index 33), Mar 1(disabled, index 34)
  // ---------------------------------------------------------------------------

  describe('ArrowRight', () => {
    it('should move focus to the next day', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb14));

      await act(async () => {
        getDayButton(feb14).focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(getDayButton(feb15)).toHaveFocus();
    });

    // July 2021 ends on Saturday: Jul 31 is the very last cell of the 5-week
    // grid (index 34). There is no trailing outside-month day, so the onLoop
    // guard does not block navigation and the month wraps to August 2021.
    // handleItemLooping(ArrowRight, 34) → newHighlightedIndex = 0
    // August 2021 starts on Sunday → index 0 = Aug 1 (in-month, enabled).
    it('should wrap to the next month and focus the first day when on the last day', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(jul31), { onVisibleDateChange });

      await act(async () => {
        getDayButton(jul31).focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(aug1));
      expect(getDayButton(aug1)).toHaveFocus();
    });

    it('should preserve focus when wrapping to the next month inside a viewport', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(jul31), {
        onVisibleDateChange,
        withViewport: true,
      });

      await act(async () => {
        getDayButton(jul31).focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(aug1));
      expect(getDayButton(aug1)).toHaveFocus();
    });
  });

  describe('ArrowLeft', () => {
    it('should move focus to the previous day', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb15));

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('{ArrowLeft}');

      expect(getDayButton(feb14)).toHaveFocus();
    });

    // August 2021 starts on Sunday: Aug 1 is the very first cell of the grid
    // (index 0). There is no leading outside-month day, so the onLoop guard
    // does not block navigation and the month wraps to July 2021.
    // handleItemLooping(ArrowLeft, 0) → newHighlightedIndex = 5×7-1 = 34
    // July 2021: index 34 = Jul 31 (Saturday, in-month, enabled).
    it('should wrap to the previous month and focus the last day when on the first day', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(aug1), { onVisibleDateChange });

      await act(async () => {
        getDayButton(aug1).focus();
      });
      await user.keyboard('{ArrowLeft}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(jul31));
      expect(getDayButton(jul31)).toHaveFocus();
    });
  });

  describe('ArrowDown', () => {
    it('should move focus down one week to the same weekday', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb8));

      await act(async () => {
        getDayButton(feb8).focus();
      });
      await user.keyboard('{ArrowDown}');

      expect(getDayButton(feb15)).toHaveFocus();
    });

    // Jul 31 (Sat, index 34) is in the last row of July 2021's 5-week grid.
    // elementsRef.current[34 + 7] is undefined (no row below), so the onLoop
    // guard does not block navigation.
    // handleItemLooping(ArrowDown, 34) → newHighlightedIndex = 34 % 7 = 6
    // August 2021: index 6 = Aug 7 (Saturday, in-month, enabled).
    it('should wrap to the next month and focus the same weekday when on the last week', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(jul31), { onVisibleDateChange });

      await act(async () => {
        getDayButton(jul31).focus();
      });
      await user.keyboard('{ArrowDown}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(aug7));
      expect(getDayButton(aug7)).toHaveFocus();
    });

    // Mar 31, 2025 (Mon) is at index 36 in March 2025's 6-week grid.
    // handleItemLooping(ArrowDown, 36) → newHighlightedIndex = 36 % 7 = 1
    // April 2025: index 1 = Mar 31 (outside-month, disabled), so the algorithm
    // skips by +7 to index 8, which is Apr 7 (Monday, in-month, enabled).
    it('should skip disabled previous-month day in the next month when wrapping down', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(mar31), { onVisibleDateChange });

      await act(async () => {
        getDayButton(mar31).focus();
      });
      await user.keyboard('{ArrowDown}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(apr7));
      expect(getDayButton(apr7)).toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Home / End
  // ---------------------------------------------------------------------------

  describe('Home', () => {
    it('should move focus to the first day of the week when pressing Home from a mid-week day', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb14));

      await act(async () => {
        getDayButton(feb14).focus();
      });
      await user.keyboard('{Home}');

      expect(getDayButton(feb9)).toHaveFocus();

      await user.keyboard('{Home}');

      expect(getDayButton(feb1)).toHaveFocus();
    });

    it('should move focus to the first day of the month when pressing Home from the first day of the week', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb9));

      await act(async () => {
        getDayButton(feb9).focus();
      });
      await user.keyboard('{Home}');

      expect(getDayButton(feb1)).toHaveFocus();
    });

    it('should move focus to the first day of the week when pressing Home from the first week of the month and first day is not the first day of the week', async () => {
      const apr4 = adapter.date('2025-04-04', 'default');
      const { user } = renderCalendar(adapter.startOfMonth(apr4));

      await act(async () => {
        getDayButton(apr4).focus();
      });
      await user.keyboard('{Home}');

      expect(getDayButton(adapter.date('2025-04-01', 'default'))).toHaveFocus();
    });
  });

  describe('End', () => {
    it('should move focus to the last day of the week when pressing End from a mid-week day', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb14));

      await act(async () => {
        getDayButton(feb14).focus();
      });
      await user.keyboard('{End}');

      expect(getDayButton(feb15)).toHaveFocus();

      await user.keyboard('{End}');

      expect(getDayButton(feb28)).toHaveFocus();
    });

    it('should move focus to the last day of the month when pressing End from the last day of the week', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb15));

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('{End}');

      expect(getDayButton(feb28)).toHaveFocus();
    });

    it('should move focus to the last day of the week when pressing End from the last week of the month and last day is not the last day of the week', async () => {
      const mar30 = adapter.date('2025-03-30', 'default');
      const { user } = renderCalendar(adapter.startOfMonth(mar30));

      await act(async () => {
        getDayButton(mar30).focus();
      });
      await user.keyboard('{End}');

      expect(getDayButton(mar31)).toHaveFocus();
    });
  });

  describe('ArrowUp', () => {
    it('should move focus up one week to the same weekday', async () => {
      const { user } = renderCalendar(adapter.startOfMonth(feb15));

      await act(async () => {
        getDayButton(feb15).focus();
      });
      await user.keyboard('{ArrowUp}');

      expect(getDayButton(feb8)).toHaveFocus();
    });

    // Aug 1 (Sun, index 0) is in the first row of August 2021's 5-week grid.
    // elementsRef.current[0 - 7] is undefined (no row above), so the onLoop
    // guard does not block navigation.
    // handleItemLooping(ArrowUp, 0) → newHighlightedIndex = 5×7-(7-0) = 28
    // July 2021: index 28 = Jul 25 (Sunday, in-month, enabled).
    it('should wrap to the previous month and focus the same weekday when on the first week', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(aug1), { onVisibleDateChange });

      await act(async () => {
        getDayButton(aug1).focus();
      });
      await user.keyboard('{ArrowUp}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(jul25));
      expect(getDayButton(jul25)).toHaveFocus();
    });

    // Apr 7 (Mon, index 8 in a Sun-first 6-week April grid) is in the second row.
    // ArrowUp targets index 1 (Mar 31, outside-month, disabled) → onLoop fires.
    // onLoop: setVisibleDate(March) + executeAfterItemMapUpdate
    // March grid: guessedIndex = 42 - 7 + (8 % 7) = 36 = Mar 31 (Mon, in-month, enabled).
    it('should change to previous month and focus same weekday when navigating up from the second week', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(apr7), { onVisibleDateChange });

      await act(async () => {
        getDayButton(apr7).focus();
      });
      await user.keyboard('{ArrowUp}');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(mar31));
      expect(getDayButton(mar31)).toHaveFocus();
    });

    it.skipIf(isJSDOM)(
      'should keep browser focus on the previous month day when wrapped in a viewport',
      async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(apr7), {
          onVisibleDateChange,
          withViewport: true,
        });

        await act(async () => {
          getDayButton(apr7).focus();
        });
        expect(getDayButton(apr7)).toHaveFocus();

        await user.keyboard('{ArrowUp}');

        await waitFor(() => {
          expect(onVisibleDateChange.mock.calls.length).toBe(1);
          expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(mar31));
          expect(getDayButton(mar31)).toHaveFocus();
        });
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Keyboard navigation should NOT trigger when the target day is disabled
  // (outside minDate/maxDate bounds).
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // focusableWhenDisabled
  //
  // February 2025 grid (en-US locale, weeks start Sunday), maxDate = Feb 14:
  //   Feb 1–14  → enabled  (index 6–19)
  //   Feb 15–28 → disabled but focusable (index 20–33)
  //   Mar 1     → outside-month → always skipped (index 34)
  // ---------------------------------------------------------------------------

  describe('focusableWhenDisabled', () => {
    const maxDate = feb14;

    describe('ArrowRight', () => {
      it('should land on a disabled day when focusableWhenDisabled is true', async () => {
        const { user } = renderCalendar(adapter.startOfMonth(feb14), {
          focusableWhenDisabled: true,
          maxDate,
        });

        await act(async () => {
          getDayButton(feb14).focus();
        });
        await user.keyboard('{ArrowRight}');

        expect(getDayButton(feb15)).toHaveFocus();
      });

      it('should continue navigating from a focused disabled day', async () => {
        const { user } = renderCalendar(adapter.startOfMonth(feb14), {
          focusableWhenDisabled: true,
          maxDate,
        });

        await act(async () => {
          getDayButton(feb14).focus();
        });
        await user.keyboard('{ArrowRight}');

        expect(getDayButton(feb15)).toHaveFocus();

        await user.keyboard('{ArrowRight}');

        expect(getDayButton(feb16)).toHaveFocus();
      });
    });

    describe('ArrowLeft', () => {
      it('should land on a disabled day when navigating left', async () => {
        const { user } = renderCalendar(adapter.startOfMonth(feb16), {
          focusableWhenDisabled: true,
          maxDate,
        });

        await act(async () => {
          getDayButton(feb16).focus();
        });
        await user.keyboard('{ArrowLeft}');

        expect(getDayButton(feb15)).toHaveFocus();
      });
    });

    describe('ArrowDown', () => {
      it('should land on a disabled day when navigating down', async () => {
        const feb21 = adapter.date('2025-02-21', 'default');

        const { user } = renderCalendar(adapter.startOfMonth(feb14), {
          focusableWhenDisabled: true,
          maxDate,
        });

        await act(async () => {
          getDayButton(feb14).focus();
        });
        await user.keyboard('{ArrowDown}');

        expect(getDayButton(feb21)).toHaveFocus();
      });
    });

    it('should not select a day when Enter is pressed on a focused disabled day', async () => {
      const onValueChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(feb14), {
        focusableWhenDisabled: true,
        maxDate,
        onValueChange,
      });

      await act(async () => {
        getDayButton(feb14).focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(getDayButton(feb15)).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(onValueChange.mock.calls.length).toBe(0);
    });

    it('should skip disabled days when focusableWhenDisabled is false (default)', async () => {
      // Default renderCalendar does not set focusableWhenDisabled on DayButton.
      // With maxDate = Feb 14, ArrowRight from Feb 14 should not move focus since there
      // are no more enabled in-month days ahead and the outside-month trailing day is
      // also skipped.
      const { user } = renderCalendar(adapter.startOfMonth(feb14), {
        maxDate,
      });

      await act(async () => {
        getDayButton(feb14).focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(getDayButton(feb14)).toHaveFocus();
    });
  });

  describe('disabled day boundary (minDate / maxDate)', () => {
    describe('PageDown', () => {
      it('should not navigate to the next month if the same day would be after maxDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb15), {
          onVisibleDateChange,
          maxDate: feb28,
        });

        await act(async () => {
          getDayButton(feb15).focus();
        });
        await user.keyboard('[PageDown]');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb15)).toHaveFocus();
      });
    });

    it('should find the closest day to navigate to the next month if the same day would be after maxDate', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = renderCalendar(adapter.startOfMonth(mar31), {
        onVisibleDateChange,
        maxDate: apr7,
      });

      await act(async () => {
        getDayButton(mar31).focus();
      });
      await user.keyboard('[PageDown]');

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
      expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(apr7));
      expect(getDayButton(apr7)).toHaveFocus();
    });

    describe('PageUp', () => {
      it('should not navigate to the previous month if the same day would be before minDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb15), {
          onVisibleDateChange,
          minDate: feb1,
        });

        await act(async () => {
          getDayButton(feb15).focus();
        });
        await user.keyboard('[PageUp]');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb15)).toHaveFocus();
      });

      it('should find the closest day to navigate to the previous month if the same day would be before minDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(aug7), {
          onVisibleDateChange,
          minDate: jul25,
        });

        await act(async () => {
          getDayButton(aug7).focus();
        });
        await user.keyboard('[PageUp]');

        expect(onVisibleDateChange.mock.calls.length).toBe(1);
        expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('keyboard');
        expect(onVisibleDateChange.mock.calls[0][0]).toEqual(adapter.startOfMonth(jul25));
        expect(getDayButton(jul25)).toHaveFocus();
      });
    });

    describe('Shift+PageDown', () => {
      it('should not navigate 12 months forward if the same day would be after maxDate', async () => {
        const maxDate = adapter.date('2025-12-31', 'default');
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb15), {
          onVisibleDateChange,
          maxDate,
        });

        await act(async () => {
          getDayButton(feb15).focus();
        });
        await user.keyboard('[ShiftLeft>][PageDown][/ShiftLeft]');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb15)).toHaveFocus();
      });
    });

    describe('Shift+PageUp', () => {
      it('should not navigate 12 months backward if the same day would be before minDate', async () => {
        const onVisibleDateChange = vi.fn();
        const minDate = adapter.date('2025-01-01', 'default');

        const { user } = renderCalendar(adapter.startOfMonth(feb15), {
          onVisibleDateChange,
          minDate,
        });

        await act(async () => {
          getDayButton(feb15).focus();
        });
        await user.keyboard('[ShiftLeft>][PageUp][/ShiftLeft]');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb15)).toHaveFocus();
      });
    });

    describe('ArrowRight', () => {
      it('should not wrap to the next month when the last day is at maxDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb28), {
          onVisibleDateChange,
          maxDate: feb28,
        });

        await act(async () => {
          getDayButton(feb28).focus();
        });
        await user.keyboard('{ArrowRight}');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb28)).toHaveFocus();
      });
    });

    describe('ArrowLeft', () => {
      it('should not wrap to the previous month when the first day is at minDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb1), {
          onVisibleDateChange,
          minDate: feb1,
        });

        await act(async () => {
          getDayButton(feb1).focus();
        });
        await user.keyboard('{ArrowLeft}');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb1)).toHaveFocus();
      });
    });

    describe('ArrowDown', () => {
      it('should not wrap to the next month when the day in the same weekday column would be after maxDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb28), {
          onVisibleDateChange,
          maxDate: feb28,
        });

        await act(async () => {
          getDayButton(feb28).focus();
        });
        await user.keyboard('{ArrowDown}');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb28)).toHaveFocus();
      });
    });

    describe('ArrowUp', () => {
      it('should not wrap to the previous month when the day in the same weekday column would be before minDate', async () => {
        const onVisibleDateChange = vi.fn();

        const { user } = renderCalendar(adapter.startOfMonth(feb1), {
          onVisibleDateChange,
          minDate: feb1,
        });

        await act(async () => {
          getDayButton(feb1).focus();
        });
        await user.keyboard('{ArrowUp}');

        expect(onVisibleDateChange.mock.calls.length).toBe(0);
        expect(getDayButton(feb1)).toHaveFocus();
      });
    });
  });
});
