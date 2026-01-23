'use client';
import * as React from 'react';
import type { Timeout } from '@base-ui/utils/useTimeout';
import {
  DEFAULT_STEP,
  MAX_POINTER_MOVES_AFTER_TOUCH,
  SCROLLING_POINTER_MOVE_DISTANCE,
  TOUCH_TIMEOUT,
} from '../utils/constants';
import { parseNumber } from '../utils/parse';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
import type {
  EventWithOptionalKeyState,
  Direction,
  IncrementValueParameters,
} from '../utils/types';
import type { NumberFieldRoot } from './NumberFieldRoot';
import type { HTMLProps } from '../../utils/types';

export function useNumberFieldButton(params: useNumberFieldButton.Parameters) {
  const {
    allowInputSyncRef,
    disabled,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    inputValue,
    intentionalTouchCheckTimeout,
    isIncrement,
    isPressedRef,
    locale,
    movesAfterTouchRef,
    readOnly,
    setValue,
    startAutoChange,
    stopAutoChange,
    valueRef,
    lastChangedValueRef,
    onValueCommitted,
  } = params;

  const incrementDownCoordsRef = React.useRef({ x: 0, y: 0 });
  const isTouchingButtonRef = React.useRef(false);
  const ignoreClickRef = React.useRef(false);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen' | ''>('');

  const pressReason: NumberFieldRoot.ChangeEventReason = isIncrement
    ? 'increment-press'
    : 'decrement-press';

  function commitValue(nativeEvent: MouseEvent) {
    allowInputSyncRef.current = true;

    // The input may be dirty but not yet blurred, so the value won't have been committed.
    const parsedValue = parseNumber(inputValue, locale, formatOptionsRef.current);

    if (parsedValue !== null) {
      // The increment value function needs to know the current input value to increment it
      // correctly.
      valueRef.current = parsedValue;
      setValue(
        parsedValue,
        createChangeEventDetails<
          NumberFieldRoot.ChangeEventReason,
          { direction?: Direction | undefined }
        >(pressReason, nativeEvent, undefined, {
          direction: isIncrement ? 1 : -1,
        }),
      );
    }
  }

  const props: React.ComponentProps<'button'> = {
    disabled,
    'aria-readonly': readOnly || undefined,
    'aria-label': isIncrement ? 'Increase' : 'Decrease',
    'aria-controls': id,
    // Keyboard users shouldn't have access to the buttons, since they can use the input element
    // to change the value. On the other hand, `aria-hidden` is not applied because touch screen
    // readers should be able to use the buttons.
    tabIndex: -1,
    style: {
      WebkitUserSelect: 'none',
      userSelect: 'none',
    },
    onTouchStart() {
      isTouchingButtonRef.current = true;
    },
    onTouchEnd() {
      isTouchingButtonRef.current = false;
    },
    onClick(event) {
      const isDisabled = disabled || readOnly;
      if (
        event.defaultPrevented ||
        isDisabled ||
        // If it's not a keyboard/virtual click, ignore.
        (pointerTypeRef.current === 'touch' ? ignoreClickRef.current : event.detail !== 0)
      ) {
        return;
      }

      commitValue(event.nativeEvent);

      const amount = getStepAmount(event) ?? DEFAULT_STEP;

      const prev = valueRef.current;

      incrementValue(amount, {
        direction: isIncrement ? 1 : -1,
        event: event.nativeEvent,
        reason: pressReason,
      });

      const committed = lastChangedValueRef.current ?? valueRef.current;
      if (committed !== prev) {
        onValueCommitted(committed, createGenericEventDetails(pressReason, event.nativeEvent));
      }
    },
    onPointerDown(event) {
      const isMainButton = !event.button || event.button === 0;
      if (event.defaultPrevented || readOnly || !isMainButton || disabled) {
        return;
      }

      pointerTypeRef.current = event.pointerType;
      ignoreClickRef.current = false;
      isPressedRef.current = true;
      incrementDownCoordsRef.current = { x: event.clientX, y: event.clientY };

      commitValue(event.nativeEvent);

      // Note: "pen" is sometimes returned for mouse usage on Linux Chrome.
      if (event.pointerType !== 'touch') {
        event.preventDefault();
        inputRef.current?.focus();
        startAutoChange(isIncrement, event);
      } else {
        // We need to check if the pointerdown was intentional, and not the result of a scroll
        // or pinch-zoom. In that case, we don't want to change the value.
        intentionalTouchCheckTimeout.start(TOUCH_TIMEOUT, () => {
          const moves = movesAfterTouchRef.current;
          movesAfterTouchRef.current = 0;
          // Only start auto-change if the touch is still pressed (prevents races
          // with pointerup occurring before the timeout fires on quick taps).
          const stillPressed = isPressedRef.current;
          if (stillPressed && moves != null && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
            startAutoChange(isIncrement, event);
            ignoreClickRef.current = true; // synthesized click should be ignored
          } else {
            // No auto-change (simple tap or scroll gesture), allow the click handler
            // to perform a single increment and commit.
            ignoreClickRef.current = false;
            stopAutoChange();
          }
        });
      }
    },
    onPointerUp(event) {
      // Ensure we mark the press as released for touch flows even if auto-change never started,
      // so the delayed auto-change check won’t start after a quick tap.
      if (event.pointerType === 'touch') {
        isPressedRef.current = false;
      }
    },
    onPointerMove(event) {
      const isDisabled = disabled || readOnly;
      if (isDisabled || event.pointerType !== 'touch' || !isPressedRef.current) {
        return;
      }

      if (movesAfterTouchRef.current != null) {
        movesAfterTouchRef.current += 1;
      }

      const { x, y } = incrementDownCoordsRef.current;
      const dx = x - event.clientX;
      const dy = y - event.clientY;

      // An alternative to this technique is to detect when the NumberField's parent container
      // has been scrolled
      if (dx ** 2 + dy ** 2 > SCROLLING_POINTER_MOVE_DISTANCE ** 2) {
        stopAutoChange();
      }
    },
    onMouseEnter(event) {
      const isDisabled = disabled || readOnly;
      if (
        event.defaultPrevented ||
        isDisabled ||
        !isPressedRef.current ||
        isTouchingButtonRef.current ||
        pointerTypeRef.current === 'touch'
      ) {
        return;
      }

      startAutoChange(isIncrement, event);
    },
    onMouseLeave() {
      if (isTouchingButtonRef.current) {
        return;
      }

      stopAutoChange();
    },
    onMouseUp() {
      if (isTouchingButtonRef.current) {
        return;
      }

      stopAutoChange();
    },
  };

  return props;
}

export interface UseNumberFieldButtonParameters {
  allowInputSyncRef: React.RefObject<boolean | null>;
  disabled: boolean;
  formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
  getStepAmount: (event?: EventWithOptionalKeyState) => number | undefined;
  id: string | undefined;
  incrementValue: (amount: number, params: IncrementValueParameters) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  intentionalTouchCheckTimeout: Timeout;
  isIncrement: boolean;
  isPressedRef: React.RefObject<boolean | null>;
  locale?: Intl.LocalesArgument | undefined;
  movesAfterTouchRef: React.RefObject<number | null>;
  readOnly: boolean;
  setValue: (value: number | null, details: NumberFieldRoot.ChangeEventDetails) => void;
  startAutoChange: (isIncrement: boolean, event?: React.MouseEvent | Event) => void;
  stopAutoChange: () => void;
  valueRef: React.RefObject<number | null>;
  lastChangedValueRef: React.RefObject<number | null>;
  onValueCommitted: (
    value: number | null,
    eventDetails: NumberFieldRoot.CommitEventDetails,
  ) => void;
}

export interface UseNumberFieldButtonReturnValue {
  props: HTMLProps;
}

export namespace useNumberFieldButton {
  export type Parameters = UseNumberFieldButtonParameters;
  export type ReturnValue = UseNumberFieldButtonReturnValue;
}
