import * as React from 'react';
import type {
  UseNumberFieldRootParameters,
  UseNumberFieldRootReturnValue,
} from './NumberFieldRoot.types';
import { useScrub } from './useScrub';
import { formatNumber } from '../utils/format';
import { toValidatedNumber } from '../utils/validate';
import {
  ARABIC_RE,
  HAN_RE,
  PERCENTAGES,
  getNumberLocaleDetails,
  parseNumber,
} from '../utils/parse';
import {
  CHANGE_VALUE_TICK_DELAY,
  DEFAULT_STEP,
  MAX_POINTER_MOVES_AFTER_TOUCH,
  SCROLLING_POINTER_MOVE_DISTANCE,
  START_AUTO_CHANGE_DELAY,
  TOUCH_TIMEOUT,
} from '../utils/constants';
import { isIOS } from '../../utils/detectBrowser';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { useControlled } from '../../utils/useControlled';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForcedRerendering } from '../../utils/useForcedRerendering';
import { useId } from '../../utils/useId';
import { useLatestRef } from '../../utils/useLatestRef';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { useForkRef } from '../../utils/useForkRef';

/**
 * The basic building block for creating custom number fields.
 *
 * Demos:
 *
 * - [Number Field](https://mui.com/base-ui/react-number-field/#hook)
 *
 * API:
 *
 * - [useNumberFieldRoot API](https://mui.com/base-ui/react-number-field/hooks-api/#use-number-field-root)
 */
export function useNumberFieldRoot(
  params: UseNumberFieldRootParameters,
): UseNumberFieldRootReturnValue {
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
    onValueChange: onValueChangeProp = () => {},
    defaultValue,
  } = params;

  const {
    labelId,
    setDisabled,
    setControlId,
    validateOnChange,
    setTouched,
    setDirty,
    validityData,
    setValidityData,
  } = useFieldRootContext();

  useEnhancedEffect(() => {
    setDisabled(disabled);
  }, [disabled, setDisabled]);

  const {
    getInputValidationProps,
    getValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const forceRender = useForcedRerendering();

  const formatOptionsRef = useLatestRef(format);
  const onValueChange = useEventCallback(onValueChangeProp);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedRef = useForkRef(inputRef, inputValidationRef);

  const startTickTimeoutRef = React.useRef(-1);
  const tickIntervalRef = React.useRef(-1);
  const intentionalTouchCheckTimeoutRef = React.useRef(-1);
  const isPressedRef = React.useRef(false);
  const isHoldingShiftRef = React.useRef(false);
  const isHoldingAltRef = React.useRef(false);
  const incrementDownCoordsRef = React.useRef({ x: 0, y: 0 });
  const movesAfterTouchRef = React.useRef(0);
  const allowInputSyncRef = React.useRef(true);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});
  const isTouchingButtonRef = React.useRef(false);
  const hasTouchedInputRef = React.useRef(false);

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: externalValue,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = valueUnwrapped ?? null;
  const valueRef = useLatestRef(value);

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [setValidityData, validityData.initialValue, value]);

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValue] = React.useState(() => formatNumber(value, [], format));
  const [inputMode, setInputMode] = React.useState<'numeric' | 'decimal' | 'text'>('numeric');

  const isMin = value != null && value <= minWithDefault;
  const isMax = value != null && value >= maxWithDefault;

  const getAllowedNonNumericKeys = useEventCallback(() => {
    const { decimal, group, currency } = getNumberLocaleDetails([], format);

    const keys = Array.from(new Set(['.', ',', decimal, group]));

    if (formatStyle === 'percent') {
      keys.push(...PERCENTAGES);
    }
    if (formatStyle === 'currency' && currency) {
      keys.push(currency);
    }
    if (minWithDefault < 0) {
      keys.push('-');
    }

    return keys;
  });

  const getStepAmount = useEventCallback(() => {
    if (isHoldingAltRef.current) {
      return smallStep;
    }
    if (isHoldingShiftRef.current) {
      return largeStep;
    }
    return step;
  });

  const setValue = useEventCallback((unvalidatedValue: number | null, event?: Event) => {
    const validatedValue = toValidatedNumber(unvalidatedValue, {
      step: getStepAmount(),
      format: formatOptionsRef.current,
      minWithDefault,
      maxWithDefault,
      minWithZeroDefault,
    });

    onValueChange?.(validatedValue, event);
    setValueUnwrapped(validatedValue);
    setDirty(validatedValue !== validityData.initialValue);

    if (validateOnChange) {
      commitValidation(validatedValue);
    }

    // We need to force a re-render, because while the value may be unchanged, the formatting may
    // be different. This forces the `useEnhancedEffect` to run which acts as a single source of
    // truth to sync the input value.
    forceRender();
  });

  const incrementValue = useEventCallback(
    (amount: number, dir: 1 | -1, currentValue?: number | null, event?: Event) => {
      const prevValue = currentValue == null ? value : currentValue;
      const nextValue =
        typeof prevValue === 'number' ? prevValue + amount * dir : Math.max(0, min ?? 0);
      setValue(nextValue, event);
    },
  );

  const stopAutoChange = useEventCallback(() => {
    window.clearTimeout(intentionalTouchCheckTimeoutRef.current);
    window.clearTimeout(startTickTimeoutRef.current);
    window.clearInterval(tickIntervalRef.current);
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });

  const startAutoChange = useEventCallback((isIncrement: boolean) => {
    stopAutoChange();

    if (!inputRef.current) {
      return;
    }

    const win = ownerWindow(inputRef.current);

    function handleContextMenu(event: Event) {
      event.preventDefault();
    }

    // A global context menu is necessary to prevent the context menu from appearing when the touch
    // is slightly outside of the element's hit area.
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

    function tick() {
      const amount = getStepAmount() ?? DEFAULT_STEP;
      incrementValue(amount, isIncrement ? 1 : -1);
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

    const nextInputValue = formatNumber(value, [], formatOptionsRef.current);

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
        if (event.altKey) {
          isHoldingAltRef.current = true;
        }
      }

      function handleWindowKeyUp(event: KeyboardEvent) {
        if (!event.shiftKey) {
          isHoldingShiftRef.current = false;
        }
        if (!event.altKey) {
          isHoldingAltRef.current = false;
        }
      }

      function handleWindowBlur() {
        // A keyup event may not be dispatched when the window loses focus.
        isHoldingShiftRef.current = false;
        isHoldingAltRef.current = false;
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

        incrementValue(amount, event.deltaY > 0 ? -1 : 1, undefined, event);
      }

      element.addEventListener('wheel', handleWheel);

      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    },
    [allowWheelScrub, incrementValue, disabled, readOnly, largeStep, step, getStepAmount],
  );

  const getGroupProps: UseNumberFieldRootReturnValue['getGroupProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        role: 'group',
      }),
    [],
  );

  const getCommonButtonProps = React.useCallback(
    (isIncrement: boolean, externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
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
            event.detail !== 0
          ) {
            return;
          }

          const amount = getStepAmount() ?? DEFAULT_STEP;

          incrementValue(amount, isIncrement ? 1 : -1, undefined, event.nativeEvent);
        },
        onPointerDown(event) {
          const isMainButton = !event.button || event.button === 0;
          const isDisabled = disabled || (isIncrement ? isMax : isMin);
          if (event.defaultPrevented || readOnly || !isMainButton || isDisabled) {
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
          const isDisabled = disabled || readOnly || (isIncrement ? isMax : isMin);
          if (isDisabled || event.pointerType !== 'touch' || !isPressedRef.current) {
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
          const isDisabled = disabled || readOnly || (isIncrement ? isMax : isMin);
          if (
            event.defaultPrevented ||
            isDisabled ||
            !isPressedRef.current ||
            isTouchingButtonRef.current
          ) {
            return;
          }

          startAutoChange(isIncrement);
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
      }),
    [
      disabled,
      readOnly,
      isMax,
      isMin,
      id,
      incrementValue,
      startAutoChange,
      stopAutoChange,
      getStepAmount,
    ],
  );

  const getIncrementButtonProps: UseNumberFieldRootReturnValue['getIncrementButtonProps'] =
    React.useCallback(
      (externalProps) => getCommonButtonProps(true, externalProps),
      [getCommonButtonProps],
    );

  const getDecrementButtonProps: UseNumberFieldRootReturnValue['getDecrementButtonProps'] =
    React.useCallback(
      (externalProps) => getCommonButtonProps(false, externalProps),
      [getCommonButtonProps],
    );

  const getInputProps: UseNumberFieldRootReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getInputValidationProps(getValidationProps(externalProps)), {
        id,
        required,
        autoFocus,
        name,
        disabled,
        readOnly,
        inputMode,
        ref: mergedRef,
        type: 'text',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: 'false',
        'aria-roledescription': 'Number field',
        'aria-invalid': invalid || undefined,
        'aria-labelledby': labelId,
        onFocus(event) {
          if (event.defaultPrevented || readOnly || disabled || hasTouchedInputRef.current) {
            return;
          }

          hasTouchedInputRef.current = true;

          // Browsers set selection at the start of the input field by default. We want to set it at
          // the end for the first focus.
          const target = event.currentTarget;
          const length = target.value.length;
          target.setSelectionRange(length, length);
        },
        onBlur(event) {
          if (event.defaultPrevented || readOnly || disabled) {
            return;
          }

          setTouched(true);
          commitValidation(valueRef.current);

          allowInputSyncRef.current = true;

          if (inputValue.trim() === '') {
            setValue(null);
            return;
          }

          const parsedValue = parseNumber(inputValue, formatOptionsRef.current);

          if (parsedValue !== null) {
            setValue(parsedValue, event.nativeEvent);
          }
        },
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          allowInputSyncRef.current = false;
          const targetValue = event.target.value;

          if (targetValue.trim() === '') {
            setInputValue(targetValue);
            setValue(null, event.nativeEvent);
            return;
          }

          if (event.isTrusted) {
            setInputValue(targetValue);
            return;
          }

          const parsedValue = parseNumber(targetValue, formatOptionsRef.current);

          if (parsedValue !== null) {
            setInputValue(targetValue);
            setValue(parsedValue, event.nativeEvent);
          }
        },
        onKeyDown(event) {
          if (event.defaultPrevented || readOnly || disabled) {
            return;
          }

          const nativeEvent = event.nativeEvent;

          allowInputSyncRef.current = true;

          const allowedNonNumericKeys = getAllowedNonNumericKeys();

          let isAllowedNonNumericKey = allowedNonNumericKeys.includes(event.key);

          const { decimal, currency, percentSign } = getNumberLocaleDetails(
            [],
            formatOptionsRef.current,
          );

          const selectionStart = event.currentTarget.selectionStart;
          const selectionEnd = event.currentTarget.selectionEnd;
          const isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

          // Allow the minus key only if there isn't already a plus or minus sign, or if all the text
          // is selected, or if only the minus sign is highlighted.
          if (event.key === '-' && allowedNonNumericKeys.includes('-')) {
            const isMinusHighlighted =
              selectionStart === 0 && selectionEnd === 1 && inputValue[0] === '-';
            isAllowedNonNumericKey =
              !inputValue.includes('-') || isAllSelected || isMinusHighlighted;
          }

          // Only allow one of each symbol.
          [decimal, currency, percentSign].forEach((symbol) => {
            if (event.key === symbol) {
              const symbolIndex = inputValue.indexOf(symbol);
              const isSymbolHighlighted =
                selectionStart === symbolIndex && selectionEnd === symbolIndex + 1;
              isAllowedNonNumericKey =
                !inputValue.includes(symbol) || isAllSelected || isSymbolHighlighted;
            }
          });

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
            nativeEvent.isComposing ||
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

          const amount = getStepAmount() ?? DEFAULT_STEP;

          // Prevent insertion of text or caret from moving.
          event.preventDefault();

          if (event.key === 'ArrowUp') {
            incrementValue(amount, 1, parsedValue, nativeEvent);
          } else if (event.key === 'ArrowDown') {
            incrementValue(amount, -1, parsedValue, nativeEvent);
          } else if (event.key === 'Home' && min != null) {
            setValue(min, nativeEvent);
          } else if (event.key === 'End' && max != null) {
            setValue(max, nativeEvent);
          }
        },
        onPaste(event) {
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
            setValue(parsedValue, event.nativeEvent);
            setInputValue(pastedData);
          }
        },
      }),
    [
      getInputValidationProps,
      getValidationProps,
      id,
      required,
      autoFocus,
      name,
      disabled,
      readOnly,
      inputMode,
      mergedRef,
      invalid,
      labelId,
      setTouched,
      commitValidation,
      valueRef,
      inputValue,
      formatOptionsRef,
      setValue,
      getAllowedNonNumericKeys,
      getStepAmount,
      min,
      max,
      incrementValue,
    ],
  );

  const scrub = useScrub({
    disabled,
    readOnly,
    value,
    inputRef,
    incrementValue,
    getStepAmount,
  });

  return React.useMemo(
    () => ({
      getGroupProps,
      getInputProps,
      getIncrementButtonProps,
      getDecrementButtonProps,
      inputRef: mergedRef,
      inputValue,
      value,
      ...scrub,
    }),
    [
      getGroupProps,
      getInputProps,
      getIncrementButtonProps,
      getDecrementButtonProps,
      mergedRef,
      inputValue,
      value,
      scrub,
    ],
  );
}
