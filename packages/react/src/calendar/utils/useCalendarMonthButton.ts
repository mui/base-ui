'use client';
import * as React from 'react';
import { usePressAndHold } from '../../utils/usePressAndHold';
import { REASONS } from '../../utils/reasons';
import type { SharedCalendarStore } from '../store/SharedCalendarStore';
import type { TemporalSupportedValue, TemporalAdapter } from '../../types/temporal';
import { selectors } from '../store';

const CHANGE_MONTH_TICK_DELAY = 100;

interface UseCalendarMonthButtonParameters {
  direction: 1 | -1;
  disabled: boolean;
  disabledProp?: boolean | undefined;
  store: SharedCalendarStore<TemporalSupportedValue, unknown>;
  adapter: TemporalAdapter;
  monthPageSize: number;
}

/**
 * Adds press-and-hold behavior to Calendar month navigation buttons.
 * On pointer down, performs one navigation immediately, then after a delay
 * starts continuous navigation at a fixed interval.
 */
export function useCalendarMonthButton(params: UseCalendarMonthButtonParameters) {
  const { direction, disabled, disabledProp, store, adapter, monthPageSize } = params;

  const autoChangeButtonRef = React.useRef<HTMLElement | null>(null);

  const { pointerHandlers, shouldSkipClick } = usePressAndHold({
    disabled,
    elementRef: autoChangeButtonRef,
    tickDelay: CHANGE_MONTH_TICK_DELAY,
    tick(triggerNativeEvent) {
      const button = autoChangeButtonRef.current;
      const currentVisibleDate = selectors.visibleDate(store.state);
      const targetDate = adapter.addMonths(currentVisibleDate, direction * monthPageSize);

      const wouldBeDisabled = selectors.isSetMonthButtonDisabled(
        store.state,
        targetDate,
        disabledProp,
      );
      if (wouldBeDisabled) {
        return false;
      }

      store.setVisibleDate(
        targetDate,
        triggerNativeEvent,
        button ?? undefined,
        REASONS.monthChange,
      );
      return true;
    },
  });

  return { pointerHandlers, autoChangeButtonRef, shouldSkipClick };
}
