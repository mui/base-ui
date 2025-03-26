'use client';
import * as React from 'react';
import {
  DEFAULT_STEP,
  MAX_POINTER_MOVES_AFTER_TOUCH,
  SCROLLING_POINTER_MOVE_DISTANCE,
  TOUCH_TIMEOUT,
} from '../utils/constants';
import { mergeProps } from '../../merge-props';
import { parseNumber } from '../utils/parse';
import type { GenericHTMLProps } from '../../utils/types';
import type { EventWithOptionalKeyState } from '../utils/types';

export function useNumberFieldButton(
  params: useNumberFieldButton.Parameters,
): useNumberFieldButton.ReturnValue {
  const {
    inputRef,
    startAutoChange,
    stopAutoChange,
    minWithDefault,
    maxWithDefault,
    value,
    inputValue,
    disabled,
    readOnly,
    id,
    setValue,
    getStepAmount,
    incrementValue,
    allowInputSyncRef,
    formatOptionsRef,
    valueRef,
    movesAfterTouchRef,
    intentionalTouchCheckTimeoutRef,
    isPressedRef,
    locale,
  } = params;

  const incrementDownCoordsRef = React.useRef({ x: 0, y: 0 });
  const isTouchingButtonRef = React.useRef(false);
  const ignoreClickRef = React.useRef(false);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen' | ''>('');

  const isMin = value != null && value <= minWithDefault;
  const isMax = value != null && value >= maxWithDefault;

  const getCommonButtonProps = React.useCallback(
    (isIncrement: boolean, externalProps = {}) => {
      function commitValue(nativeEvent: MouseEvent) {
        allowInputSyncRef.current = true;

        // The input may be dirty but not yet blurred, so the value won't have been committed.
        const parsedValue = parseNumber(inputValue, locale, formatOptionsRef.current);

        if (parsedValue !== null) {
          // The increment value function needs to know the current input value to increment it
          // correctly.
          valueRef.current = parsedValue;
          setValue(parsedValue, nativeEvent);
        }
      }

      return mergeProps<'button'>(
        {
          disabled: disabled || (isIncrement ? isMax : isMin),
          type: 'button',
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
            const isDisabled = disabled || readOnly || (isIncrement ? isMax : isMin);
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

            incrementValue(amount, isIncrement ? 1 : -1, undefined, event.nativeEvent);
          },
          onPointerDown(event) {
            const isMainButton = !event.button || event.button === 0;
            const isDisabled = disabled || (isIncrement ? isMax : isMin);
            if (event.defaultPrevented || readOnly || !isMainButton || isDisabled) {
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
              intentionalTouchCheckTimeoutRef.current = window.setTimeout(() => {
                const moves = movesAfterTouchRef.current;
                movesAfterTouchRef.current = 0;
                if (moves != null && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
                  ignoreClickRef.current = true;
                  startAutoChange(isIncrement, event);
                } else {
                  stopAutoChange();
                }
              }, TOUCH_TIMEOUT);
            }
          },
          onPointerMove(event) {
            const isDisabled = disabled || readOnly || (isIncrement ? isMax : isMin);
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
            const isDisabled = disabled || readOnly || (isIncrement ? isMax : isMin);
            if (
              event.defaultPrevented ||
              isDisabled ||
              !isPressedRef.current ||
              isTouchingButtonRef.current
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
        },
        externalProps,
      );
    },
    [
      allowInputSyncRef,
      disabled,
      formatOptionsRef,
      getStepAmount,
      id,
      incrementValue,
      inputRef,
      inputValue,
      intentionalTouchCheckTimeoutRef,
      isMax,
      isMin,
      isPressedRef,
      locale,
      movesAfterTouchRef,
      readOnly,
      setValue,
      startAutoChange,
      stopAutoChange,
      valueRef,
    ],
  );

  return React.useMemo(
    () => ({
      getCommonButtonProps,
    }),
    [getCommonButtonProps],
  );
}

namespace useNumberFieldButton {
  export interface Parameters {
    allowInputSyncRef: React.RefObject<boolean | null>;
    disabled: boolean;
    formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
    getStepAmount: (event?: EventWithOptionalKeyState) => number | undefined;
    id: string | undefined;
    incrementValue: (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: Event,
    ) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    inputValue: string;
    intentionalTouchCheckTimeoutRef: React.RefObject<number | null>;
    isPressedRef: React.RefObject<boolean | null>;
    locale?: Intl.LocalesArgument;
    maxWithDefault: number;
    minWithDefault: number;
    movesAfterTouchRef: React.RefObject<number | null>;
    readOnly: boolean;
    setValue: (unvalidatedValue: number | null, event?: Event) => void;
    startAutoChange: (isIncrement: boolean, event?: React.MouseEvent | Event) => void;
    stopAutoChange: () => void;
    value: number | null;
    valueRef: React.RefObject<number | null>;
  }

  export interface ReturnValue {
    getCommonButtonProps: (
      isIncrement: boolean,
      externalProps?: GenericHTMLProps,
    ) => GenericHTMLProps;
  }
}
