import * as React from 'react';
import { useEventCallback } from '../utils/useEventCallback';
import { useControlled } from '../utils/useControlled';
import type { NumberFieldProps } from '../NumberField';
import { useLatestRef } from '../utils/useLatestRef';
import { defineProps } from '../utils/defineProps';
import type { UseNumberFieldReturnValue } from './useNumberField.types';
import { ownerDocument, ownerWindow } from '../utils/owner';
import { useId } from '../utils/useId';
import { isIOS } from '../utils/detectBrowser';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import { formatNumber } from '../NumberField/utils/format';
import { toValidatedNumber } from '../NumberField/utils/validate';
import {
  ARABIC_RE,
  HAN_RE,
  PERCENTAGES,
  getNumberLocaleDetails,
  parseNumber,
} from '../NumberField/utils/parse';
import { useForcedRerendering } from '../utils/useForcedRerendering';
import { useScrub } from './useScrub';
import {
  CHANGE_VALUE_TICK_DELAY,
  DEFAULT_STEP,
  MAX_POINTER_MOVES_AFTER_TOUCH,
  SCROLLING_POINTER_MOVE_DISTANCE,
  START_AUTO_CHANGE_DELAY,
  TOUCH_TIMEOUT,
} from './constants';

function handleGlobalContextMenu(event: Event) {
  event.preventDefault();
}

/**
 *
 * Demos:
 *
 * - [Number Field](https://mui.com/base-ui/react-number-field/#hook)
 *
 * API:
 *
 * - [useNumberField API](https://mui.com/base-ui/react-number-field/hooks-api/#use-number-field)
 */
export function useNumberField(params: NumberFieldProps): UseNumberFieldReturnValue {
  const {
    id: idProp,
    name,
    min,
    max,
    smallStep = 0.1,
    step,
    largeStep = 10,
    required = false,
    disabled = false,
    invalid = false,
    readOnly = false,
    autoFocus = false,
    allowWheelScrub = false,
    format,
    value: externalValue,
    onChange,
    defaultValue,
  } = params;

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;

  const allowedNonNumericKeys = React.useMemo(() => {
    const { decimal, group } = getNumberLocaleDetails();
    const value = Array.from(new Set(['.', ',', decimal, group]));
    if (formatStyle === 'percent') {
      value.push(...PERCENTAGES);
    }
    if (minWithDefault < 0) {
      value.push('-');
    }
    // Consider adding more allowed keys, such as for currencies.
    return value;
  }, [minWithDefault, formatStyle]);

  const id = useId(idProp);

  const forceRender = useForcedRerendering();

  const formatOptionsRef = useLatestRef(format);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const startTickTimeoutRef = React.useRef(-1);
  const tickIntervalRef = React.useRef(-1);
  const intentionalTouchCheckTimeoutRef = React.useRef(-1);
  const isPressedRef = React.useRef(false);
  const isHoldingShiftRef = React.useRef(false);
  const isHoldingMetaRef = React.useRef(false);
  const incrementDownCoordsRef = React.useRef({ x: 0, y: 0 });
  const movesAfterTouchRef = React.useRef(0);
  const allowInputSyncRef = React.useRef(true);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});
  const isTouchingRef = React.useRef(false);

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: externalValue,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = valueUnwrapped ?? null;

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValue] = React.useState(() => formatNumber(value, undefined, format));
  const [inputMode, setInputMode] = React.useState<'numeric' | 'decimal' | 'text'>('numeric');

  // When scrubbing gets clamped, we want to keep the raw value to be able to ensure changing scrub
  // direction only changes the value once the pointer moves past the point at which the value
  // started being clamped.
  const rawValueRef = React.useRef(value);

  const isMin = value != null && value <= minWithDefault;
  const isMax = value != null && value >= maxWithDefault;

  const getStepAmount = useEventCallback(() => {
    if (isHoldingMetaRef.current) {
      return smallStep;
    }
    if (isHoldingShiftRef.current) {
      return largeStep;
    }
    return step;
  });

  const setValue = useEventCallback((unvalidatedValue: number | null) => {
    const validatedValue = toValidatedNumber(unvalidatedValue, {
      step: getStepAmount(),
      format: formatOptionsRef.current,
      minWithDefault,
      maxWithDefault,
      minWithZeroDefault,
    });

    onChange?.(validatedValue);
    setValueUnwrapped(validatedValue);
    // We need to force a re-render, because while the value may be unchanged, the formatting may
    // be different. This forces the `useEnhancedEffect` to run which acts as a single source of
    // truth to sync the input value.
    forceRender();
  });

  const stopAutoChange = useEventCallback(() => {
    window.clearTimeout(intentionalTouchCheckTimeoutRef.current);
    window.clearTimeout(startTickTimeoutRef.current);
    window.clearInterval(tickIntervalRef.current);
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });

  const changeValue = useEventCallback((amount: number, dir: 1 | -1) => {
    const rawValue = rawValueRef.current;
    const nextValue =
      typeof rawValue === 'number' ? rawValue + amount * dir : Math.max(0, min ?? 0);
    rawValueRef.current = nextValue;
    setValue(nextValue);
  });

  const increment = useEventCallback((amount: number) => {
    changeValue(amount, 1);
  });

  const decrement = useEventCallback((amount: number) => {
    changeValue(amount, -1);
  });

  const startAutoChange = useEventCallback((isIncrement: boolean) => {
    stopAutoChange();

    if (!inputRef.current) {
      return;
    }

    const win = ownerWindow(inputRef.current);

    // A global context menu is necessary to prevent the context menu from appearing when the touch
    // is slightly outside of the element's hit area.
    win.addEventListener('contextmenu', handleGlobalContextMenu);
    unsubscribeFromGlobalContextMenuRef.current = () => {
      win.removeEventListener('contextmenu', handleGlobalContextMenu);
    };

    win.addEventListener(
      'pointerup',
      () => {
        isPressedRef.current = false;
        stopAutoChange();
      },
      { once: true },
    );

    function tick() {
      const amount = getStepAmount() ?? DEFAULT_STEP;
      if (isIncrement) {
        increment(amount);
      } else {
        decrement(amount);
      }
    }

    tick();

    startTickTimeoutRef.current = window.setTimeout(() => {
      tickIntervalRef.current = window.setInterval(tick, CHANGE_VALUE_TICK_DELAY);
    }, START_AUTO_CHANGE_DELAY);
  });

  // We need to update the input value when the external `value` prop changes. This ends up acting
  // as a single source of truth to update the input value, bypassing the need to manually set it in
  // each event handler internally in this hook.
  // This is done inside a layout effect as an alternative to the technique to set state during
  // render as we're accessing a ref, which must be inside an effect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  //
  // ESLint is disabled because it needs to run even if the parsed value hasn't changed, since the
  // value still can be formatted differently.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEnhancedEffect(function syncFormattedInputValueOnValueChange() {
    // This ensures the value is only updated on blur rather than every keystroke, but still
    // allows the input value to be updated when the value is changed externally.
    if (!allowInputSyncRef.current) {
      return;
    }

    const nextInputValue = formatNumber(value, undefined, formatOptionsRef.current);

    if (nextInputValue !== inputValue) {
      setInputValue(nextInputValue);
    }
  });

  useEnhancedEffect(
    function setDynamicInputModeForIOS() {
      if (!isIOS()) {
        return;
      }

      // iOS numeric software keyboard doesn't have a minus key, so we need to use the default
      // keyboard to let the user input a negative number.
      let computedInputMode: typeof inputMode = 'text';

      if (minWithDefault >= 0) {
        // iOS numeric software keyboard doesn't have a decimal key for "numeric" input mode, but
        // this is better than the "text" input if possible to use.
        computedInputMode = 'decimal';
      }

      setInputMode(computedInputMode);
    },
    [minWithDefault, formatStyle],
  );

  React.useEffect(() => {
    return () => stopAutoChange();
  }, [stopAutoChange]);

  React.useEffect(
    function registerGlobalStepModifierKeyListeners() {
      if (disabled || readOnly || !inputRef.current) {
        return undefined;
      }

      function handleWindowKeyDown(event: KeyboardEvent) {
        if (event.shiftKey) {
          isHoldingShiftRef.current = true;
        }
        if (event.metaKey) {
          isHoldingMetaRef.current = true;
        }
      }

      function handleWindowKeyUp(event: KeyboardEvent) {
        if (!event.shiftKey) {
          isHoldingShiftRef.current = false;
        }
        if (!event.metaKey) {
          isHoldingMetaRef.current = false;
        }
      }

      function handleWindowBlur() {
        // A keyup event may not be dispatched when the window loses focus.
        isHoldingShiftRef.current = false;
        isHoldingMetaRef.current = false;
      }

      const win = ownerWindow(inputRef.current);

      win.addEventListener('keydown', handleWindowKeyDown, true);
      win.addEventListener('keyup', handleWindowKeyUp, true);
      win.addEventListener('blur', handleWindowBlur);

      return () => {
        win.removeEventListener('keydown', handleWindowKeyDown, true);
        win.removeEventListener('keyup', handleWindowKeyUp, true);
        win.removeEventListener('blur', handleWindowBlur);
      };
    },
    [disabled, readOnly],
  );

  // The `onWheel` prop can't be prevented, so we need to use a global event listener.
  React.useEffect(
    function registerElementWheelListener() {
      const element = inputRef.current;
      if (disabled || readOnly || !allowWheelScrub || !element) {
        return undefined;
      }

      function handleWheel(event: WheelEvent) {
        if (
          // Allow pinch-zooming.
          event.ctrlKey ||
          ownerDocument(inputRef.current).activeElement !== inputRef.current
        ) {
          return;
        }

        // Prevent the default behavior to avoid scrolling the page.
        event.preventDefault();

        const amount = getStepAmount() ?? DEFAULT_STEP;

        if (event.deltaY > 0) {
          decrement(amount);
        } else {
          increment(amount);
        }
      }

      element.addEventListener('wheel', handleWheel);

      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    },
    [allowWheelScrub, increment, decrement, disabled, readOnly, largeStep, step, getStepAmount],
  );

  const getGroupProps: UseNumberFieldReturnValue['getGroupProps'] = React.useCallback(
    (externalProps = {}) => ({
      role: 'group',
      ...externalProps,
    }),
    [],
  );

  const getCommonButtonProps = React.useCallback(
    (isIncrement: boolean, externalProps: React.ComponentPropsWithRef<'button'> = {}) =>
      defineProps<'button'>({
        disabled: disabled || (isIncrement ? isMax : isMin),
        type: 'button',
        'aria-readonly': readOnly || undefined,
        'aria-label': isIncrement ? 'Increase' : 'Decrease',
        'aria-controls': id,
        // Keyboard users shouldn't have access to the buttons, since they can use the input element
        // to change the value. On the other hand, `aria-hidden` is not applied because touch screen
        // readers should be able to use the buttons.
        tabIndex: -1,
        ...externalProps,
        style: {
          WebkitUserSelect: 'none',
          userSelect: 'none',
          ...externalProps.style,
        },
        onTouchStart(event) {
          externalProps.onTouchStart?.(event);
          isTouchingRef.current = true;
        },
        onTouchEnd(event) {
          externalProps.onTouchEnd?.(event);
          isTouchingRef.current = false;
        },
        onClick(event) {
          externalProps.onClick?.(event);
          if (
            event.defaultPrevented ||
            readOnly ||
            // If it's not a keyboard/virtual click, ignore.
            event.detail !== 0
          ) {
            return;
          }

          const amount = getStepAmount() ?? DEFAULT_STEP;

          if (isIncrement) {
            increment(amount);
          } else {
            decrement(amount);
          }
        },
        onPointerDown(event) {
          externalProps.onPointerDown?.(event);
          const isMainButton = !event.button || event.button === 0;
          if (event.defaultPrevented || readOnly || !isMainButton || disabled) {
            return;
          }

          isPressedRef.current = true;
          incrementDownCoordsRef.current = { x: event.clientX, y: event.clientY };

          // Note: "pen" is sometimes returned for mouse usage on Linux Chrome.
          if (event.pointerType !== 'touch') {
            event.preventDefault();
            inputRef.current?.focus();
            startAutoChange(isIncrement);
          } else {
            // We need to check if the pointerdown was intentional, and not the result of a scroll
            // or pinch-zoom. In that case, we don't want to change the value.
            intentionalTouchCheckTimeoutRef.current = window.setTimeout(() => {
              const moves = movesAfterTouchRef.current;
              movesAfterTouchRef.current = 0;
              if (moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
                startAutoChange(isIncrement);
              } else {
                stopAutoChange();
              }
            }, TOUCH_TIMEOUT);
          }
        },
        onPointerMove(event) {
          externalProps.onPointerMove?.(event);
          if (readOnly || disabled || event.pointerType !== 'touch' || !isPressedRef.current) {
            return;
          }

          movesAfterTouchRef.current += 1;

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
          externalProps.onMouseEnter?.(event);
          if (
            event.defaultPrevented ||
            readOnly ||
            disabled ||
            !isPressedRef.current ||
            isTouchingRef.current
          ) {
            return;
          }

          startAutoChange(isIncrement);
        },
        onMouseLeave(event) {
          externalProps.onMouseLeave?.(event);
          if (isTouchingRef.current) {
            return;
          }

          stopAutoChange();
        },
        onMouseUp(event) {
          externalProps.onMouseUp?.(event);
          if (isTouchingRef.current) {
            return;
          }

          stopAutoChange();
        },
      }),
    [
      disabled,
      readOnly,
      isMax,
      isMin,
      id,
      increment,
      decrement,
      startAutoChange,
      stopAutoChange,
      getStepAmount,
    ],
  );

  const getIncrementButtonProps: UseNumberFieldReturnValue['getIncrementButtonProps'] =
    React.useCallback(
      (externalProps) => getCommonButtonProps(true, externalProps),
      [getCommonButtonProps],
    );

  const getDecrementButtonProps: UseNumberFieldReturnValue['getDecrementButtonProps'] =
    React.useCallback(
      (externalProps) => getCommonButtonProps(false, externalProps),
      [getCommonButtonProps],
    );

  const getInputProps: UseNumberFieldReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) => ({
      id,
      required,
      autoFocus,
      name,
      disabled,
      readOnly,
      inputMode,
      type: 'text',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: 'false',
      'aria-roledescription': 'Number field',
      'aria-invalid': invalid || undefined,
      ...externalProps,
      ref: inputRef,
      onBlur(event) {
        externalProps.onBlur?.(event);
        if (event.defaultPrevented || readOnly || disabled) {
          return;
        }

        allowInputSyncRef.current = true;

        if (inputValue.trim() === '') {
          setValue(null);
          return;
        }

        const parsedValue = parseNumber(inputValue, formatOptionsRef.current);

        if (parsedValue !== null) {
          setValue(parsedValue);
        }
      },
      onChange(event) {
        externalProps.onChange?.(event);
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.nativeEvent.defaultPrevented) {
          return;
        }

        allowInputSyncRef.current = false;
        const targetValue = event.target.value;

        if (targetValue.trim() === '') {
          setInputValue(targetValue);
          setValue(null);
          return;
        }

        if (event.isTrusted) {
          setInputValue(targetValue);
          return;
        }

        const parsedValue = parseNumber(targetValue, formatOptionsRef.current);

        if (parsedValue !== null) {
          setInputValue(targetValue);
          setValue(parsedValue);
        }
      },
      onKeyDown(event) {
        externalProps.onKeyDown?.(event);
        if (event.defaultPrevented || readOnly || disabled) {
          return;
        }

        allowInputSyncRef.current = true;

        let isAllowedNonNumericKey = allowedNonNumericKeys.includes(event.key);

        const { decimal } = getNumberLocaleDetails(undefined, formatOptionsRef.current);

        const selectionStart = event.currentTarget.selectionStart;
        const selectionEnd = event.currentTarget.selectionEnd;
        const isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

        // Allow the minus key only if there isn't already a plus or minus sign, or if all the text
        // is selected, or if only the minus sign is highlighted.
        if (event.key === '-' && allowedNonNumericKeys.includes('-')) {
          const isMinusHighlighted =
            selectionStart === 0 && selectionEnd === 1 && inputValue[0] === '-';
          isAllowedNonNumericKey = !inputValue.includes('-') || isAllSelected || isMinusHighlighted;
        }

        // Allow only one decimal separator, or if all the text is selected, or if only the decimal
        // separator is highlighted.
        if (event.key === decimal) {
          const decimalIndex = inputValue.indexOf(decimal);
          const isDecimalHighlighted =
            selectionStart === decimalIndex && selectionEnd === decimalIndex + 1;
          isAllowedNonNumericKey =
            !inputValue.includes(decimal) || isAllSelected || isDecimalHighlighted;
        }

        const isLatinNumeral = /^[0-9]$/.test(event.key);
        const isArabicNumeral = ARABIC_RE.test(event.key);
        const isHanNumeral = HAN_RE.test(event.key);
        const isNavigateKey = [
          'Backspace',
          'Delete',
          'ArrowLeft',
          'ArrowRight',
          'Tab',
          'Enter',
        ].includes(event.key);

        if (
          // Allow composition events (e.g., pinyin)
          event.nativeEvent.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          isAllowedNonNumericKey ||
          isLatinNumeral ||
          isArabicNumeral ||
          isHanNumeral ||
          isNavigateKey
        ) {
          return;
        }

        // We need to commit the number at this point if the input hasn't been blurred.
        const parsedValue = parseNumber(inputValue, formatOptionsRef.current);
        if (parsedValue !== null) {
          rawValueRef.current = parsedValue;
        }

        const amount = getStepAmount() ?? DEFAULT_STEP;

        // Prevent insertion of text or caret from moving.
        event.preventDefault();

        if (event.key === 'ArrowUp') {
          increment(amount);
        } else if (event.key === 'ArrowDown') {
          decrement(amount);
        } else if (event.key === 'Home' && min != null) {
          setValue(min);
        } else if (event.key === 'End' && max != null) {
          setValue(max);
        }
      },
      onPaste(event) {
        externalProps.onPaste?.(event);
        if (event.defaultPrevented || readOnly || disabled) {
          return;
        }

        // Prevent `onChange` from being called.
        event.preventDefault();

        const clipboardData = event.clipboardData || window.Clipboard;
        const pastedData = clipboardData.getData('text/plain');
        const parsedValue = parseNumber(pastedData, formatOptionsRef.current);

        if (parsedValue !== null) {
          allowInputSyncRef.current = false;
          setValue(parsedValue);
          setInputValue(pastedData);
        }
      },
    }),
    [
      id,
      required,
      autoFocus,
      name,
      disabled,
      readOnly,
      inputMode,
      invalid,
      inputValue,
      formatOptionsRef,
      setValue,
      allowedNonNumericKeys,
      getStepAmount,
      min,
      max,
      increment,
      decrement,
    ],
  );

  const scrub = useScrub({
    disabled,
    readOnly,
    value,
    inputRef,
    rawValueRef,
    increment,
    getStepAmount,
  });

  return React.useMemo(
    () => ({
      getGroupProps,
      getInputProps,
      getIncrementButtonProps,
      getDecrementButtonProps,
      inputRef,
      inputValue,
      value,
      ...scrub,
    }),
    [
      getGroupProps,
      getInputProps,
      getIncrementButtonProps,
      getDecrementButtonProps,
      inputValue,
      value,
      scrub,
    ],
  );
}
