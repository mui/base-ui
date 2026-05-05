'use client';
import * as React from 'react';
import { usePressAndHold } from '../../internals/usePressAndHold';
import {
  DEFAULT_STEP,
  CHANGE_VALUE_TICK_DELAY,
  START_AUTO_CHANGE_DELAY,
  SCROLLING_POINTER_MOVE_DISTANCE,
} from '../utils/constants';
import { parseNumber } from '../utils/parse';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import type {
  EventWithOptionalKeyState,
  Direction,
  IncrementValueParameters,
} from '../utils/types';
import type { NumberFieldRoot } from './NumberFieldRoot';
import type { HTMLProps } from '../../internals/types';
import { REASONS } from '../../internals/reasons';

// Treat pen as touch-like to avoid forcing the software keyboard on stylus taps.
// Linux Chrome may emit "pen" historically for mouse usage due to a bug, but the touch path
// still works with minor behavioral differences.
function isTouchLikePointerType(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen';
}

export function useNumberFieldButton(params: UseNumberFieldButtonParameters) {
  const {
    allowInputSyncRef,
    disabled,
    formatOptionsRef,
    getStepAmount,
    id,
    incrementValue,
    inputRef,
    inputValue,
    isIncrement,
    locale,
    readOnly,
    setValue,
    valueRef,
    lastChangedValueRef,
    onValueCommitted,
  } = params;

  const pressReason: NumberFieldRoot.ChangeEventReason = isIncrement
    ? REASONS.incrementPress
    : REASONS.decrementPress;

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

  const { pointerHandlers, shouldSkipClick } = usePressAndHold({
    disabled: disabled || readOnly,
    elementRef: inputRef,
    tickDelay: CHANGE_VALUE_TICK_DELAY,
    startDelay: START_AUTO_CHANGE_DELAY,
    scrollDistance: SCROLLING_POINTER_MOVE_DISTANCE,
    tick(triggerEvent) {
      const amount = getStepAmount(triggerEvent as EventWithOptionalKeyState) ?? DEFAULT_STEP;
      return incrementValue(amount, {
        direction: isIncrement ? 1 : -1,
        event: triggerEvent,
        reason: pressReason,
      });
    },
    onStop(nativeEvent: PointerEvent) {
      const committed = lastChangedValueRef.current ?? valueRef.current;
      onValueCommitted(committed, createGenericEventDetails(pressReason, nativeEvent));
    },
  });

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
    ...pointerHandlers,
    onClick(event) {
      const isDisabled = disabled || readOnly;
      if (event.defaultPrevented || isDisabled || shouldSkipClick(event)) {
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

      // Sync dirty input value before starting the hold sequence.
      commitValue(event.nativeEvent);

      if (!isTouchLikePointerType(event.pointerType)) {
        // Focus the input so the user can continue with keyboard interactions.
        inputRef.current?.focus();
      }

      pointerHandlers.onPointerDown(event);
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
  incrementValue: (amount: number, params: IncrementValueParameters) => boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  isIncrement: boolean;
  locale?: Intl.LocalesArgument | undefined;
  readOnly: boolean;
  setValue: (value: number | null, details: NumberFieldRoot.ChangeEventDetails) => boolean;
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

export interface UseNumberFieldButtonState {}
