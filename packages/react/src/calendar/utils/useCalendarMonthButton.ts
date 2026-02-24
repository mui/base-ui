'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useInterval } from '@base-ui/utils/useInterval';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerWindow } from '@base-ui/utils/owner';
import type { TemporalAdapter } from '../../types/temporal-adapter';
import type { SharedCalendarStore } from '../store/SharedCalendarStore';
import type { TemporalSupportedValue } from '../../types/temporal';
import { selectors } from '../store';

const START_AUTO_CHANGE_DELAY = 400;
const CHANGE_MONTH_TICK_DELAY = 100;
const TOUCH_TIMEOUT = 50;
const MAX_POINTER_MOVES_AFTER_TOUCH = 3;
const SCROLLING_POINTER_MOVE_DISTANCE = 20;

function isTouchLikePointerType(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen';
}

interface UseCalendarMonthButtonParameters {
  direction: 1 | -1;
  disabled: boolean;
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
  const { direction, disabled, store, adapter, monthPageSize } = params;

  const startTickTimeout = useTimeout();
  const tickInterval = useInterval();
  const intentionalTouchCheckTimeout = useTimeout();

  const isPressedRef = React.useRef(false);
  const movesAfterTouchRef = React.useRef(0);
  const incrementDownCoordsRef = React.useRef({ x: 0, y: 0 });
  const autoChangeButtonRef = React.useRef<HTMLElement | null>(null);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});

  const stopAutoChange = useStableCallback(() => {
    intentionalTouchCheckTimeout.clear();
    startTickTimeout.clear();
    tickInterval.clear();
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });

  const startAutoChange = useStableCallback((triggerNativeEvent?: Event) => {
    stopAutoChange();

    const button = autoChangeButtonRef.current;
    if (!button) {
      return;
    }

    const win = ownerWindow(button);

    function handleContextMenu(event: Event) {
      event.preventDefault();
    }

    win.addEventListener('contextmenu', handleContextMenu);
    unsubscribeFromGlobalContextMenuRef.current = () => {
      win.removeEventListener('contextmenu', handleContextMenu);
    };

    win.addEventListener(
      'pointerup',
      () => {
        isPressedRef.current = false;
        stopAutoChange();
      },
      { once: true },
    );

    function tick(): boolean {
      const currentVisibleDate = store.state.visibleDate;
      const targetDate = adapter.addMonths(currentVisibleDate, direction * monthPageSize);

      const wouldBeDisabled = selectors.isSetMonthButtonDisabled(
        store.state,
        undefined,
        targetDate,
      );
      if (wouldBeDisabled) {
        return false;
      }

      store.setVisibleDate(targetDate, triggerNativeEvent, button ?? undefined, 'month-change');
      return true;
    }

    if (!tick()) {
      stopAutoChange();
      return;
    }

    startTickTimeout.start(START_AUTO_CHANGE_DELAY, () => {
      tickInterval.start(CHANGE_MONTH_TICK_DELAY, () => {
        if (!tick()) {
          stopAutoChange();
        }
      });
    });
  });

  const pointerHandlers = {
    onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      const isMainButton = !event.button || event.button === 0;
      if (event.defaultPrevented || !isMainButton || disabled) {
        return;
      }

      isPressedRef.current = true;
      incrementDownCoordsRef.current = { x: event.clientX, y: event.clientY };

      const isTouchPointer = isTouchLikePointerType(event.pointerType);

      if (!isTouchPointer) {
        event.preventDefault();
        startAutoChange(event.nativeEvent);
      } else {
        intentionalTouchCheckTimeout.start(TOUCH_TIMEOUT, () => {
          const moves = movesAfterTouchRef.current;
          movesAfterTouchRef.current = 0;
          const stillPressed = isPressedRef.current;
          if (stillPressed && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
            startAutoChange(event.nativeEvent);
          } else {
            stopAutoChange();
          }
        });
      }
    },
    onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
      if (isTouchLikePointerType(event.pointerType)) {
        isPressedRef.current = false;
      }
    },
    onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
      if (disabled || !isTouchLikePointerType(event.pointerType) || !isPressedRef.current) {
        return;
      }

      if (movesAfterTouchRef.current != null) {
        movesAfterTouchRef.current += 1;
      }

      const { x, y } = incrementDownCoordsRef.current;
      const dx = x - event.clientX;
      const dy = y - event.clientY;

      if (dx ** 2 + dy ** 2 > SCROLLING_POINTER_MOVE_DISTANCE ** 2) {
        stopAutoChange();
      }
    },
  };

  return { pointerHandlers, autoChangeButtonRef };
}
