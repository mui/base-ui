'use client';
import * as React from 'react';
import { useScrub } from './useScrub';
import { formatNumber } from '../../utils/formatNumber';
import { toValidatedNumber } from '../utils/validate';
import { PERCENTAGES, getNumberLocaleDetails } from '../utils/parse';
import { CHANGE_VALUE_TICK_DELAY, DEFAULT_STEP, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { isIOS } from '../../utils/detectBrowser';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { useControlled } from '../../utils/useControlled';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForcedRerendering } from '../../utils/useForcedRerendering';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLatestRef } from '../../utils/useLatestRef';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useForkRef } from '../../utils/useForkRef';
import { useField } from '../../field/useField';
import type { ScrubHandle } from './useScrub';

export function useNumberFieldRoot(
  params: useNumberFieldRoot.Parameters,
): useNumberFieldRoot.ReturnValue {
  const {
    id: idProp,
    name,
    min,
    max,
    smallStep = 0.1,
    step,
    largeStep = 10,
    required = false,
    disabled: disabledProp = false,
    invalid = false,
    readOnly = false,
    autoFocus = false,
    allowWheelScrub = false,
    format,
    value: externalValue,
    onValueChange: onValueChangeProp,
    defaultValue,
    locale,
  } = params;

  const {
    setControlId,
    validationMode,
    setDirty,
    validityData,
    setValidityData,
    disabled: fieldDisabled,
    setFilled,
  } = useFieldRootContext();

  const { inputRef: inputValidationRef, commitValidation } = useFieldControlValidation();

  const disabled = fieldDisabled || disabledProp;

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedRef = useForkRef(inputRef, inputValidationRef);

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: externalValue,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = valueUnwrapped ?? null;
  const valueRef = useLatestRef(value);

  useEnhancedEffect(() => {
    setFilled(value !== null);
  }, [setFilled, value]);

  useField({
    id,
    commitValidation,
    value,
    controlRef: inputRef,
  });

  const forceRender = useForcedRerendering();

  const formatOptionsRef = useLatestRef(format);
  const onValueChange = useEventCallback(onValueChangeProp);

  const startTickTimeoutRef = React.useRef(-1);
  const tickIntervalRef = React.useRef(-1);
  const intentionalTouchCheckTimeoutRef = React.useRef(-1);
  const isPressedRef = React.useRef(false);
  const isHoldingShiftRef = React.useRef(false);
  const isHoldingAltRef = React.useRef(false);
  const movesAfterTouchRef = React.useRef(0);
  const allowInputSyncRef = React.useRef(true);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [setValidityData, validityData.initialValue, value]);

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValue] = React.useState(() => formatNumber(value, locale, format));
  const [inputMode, setInputMode] = React.useState<InputMode>('numeric');

  const getAllowedNonNumericKeys = useEventCallback(() => {
    const { decimal, group, currency } = getNumberLocaleDetails(locale, format);

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

    if (validationMode === 'onChange') {
      commitValidation(validatedValue);
    }

    // We need to force a re-render, because while the value may be unchanged, the formatting may
    // be different. This forces the `useEnhancedEffect` to run which acts as a single source of
    // truth to sync the input value.
    forceRender();
  });

  const incrementValue = useEventCallback(
    (amount: number, dir: 1 | -1, currentValue?: number | null, event?: Event) => {
      const prevValue = currentValue == null ? valueRef.current : currentValue;
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

    const nextInputValue = formatNumber(value, locale, formatOptionsRef.current);

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
      inputRef,
      mergedRef,
      inputValue,
      value,
      startAutoChange,
      stopAutoChange,
      minWithDefault,
      maxWithDefault,
      disabled,
      readOnly,
      id,
      setValue,
      incrementValue,
      getStepAmount,
      allowInputSyncRef,
      formatOptionsRef,
      valueRef,
      isPressedRef,
      intentionalTouchCheckTimeoutRef,
      movesAfterTouchRef,
      name,
      required,
      invalid,
      autoFocus,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
      ...scrub,
    }),
    [
      inputRef,
      mergedRef,
      inputValue,
      value,
      scrub,
      startAutoChange,
      stopAutoChange,
      minWithDefault,
      maxWithDefault,
      disabled,
      readOnly,
      id,
      setValue,
      incrementValue,
      getStepAmount,
      allowInputSyncRef,
      formatOptionsRef,
      valueRef,
      isPressedRef,
      intentionalTouchCheckTimeoutRef,
      movesAfterTouchRef,
      name,
      required,
      invalid,
      autoFocus,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
    ],
  );
}

export type InputMode = 'numeric' | 'decimal' | 'text';

export namespace useNumberFieldRoot {
  export interface Parameters {
    /**
     * The id of the input element.
     */
    id?: string;
    /**
     * The minimum value of the input element.
     */
    min?: number;
    /**
     * The maximum value of the input element.
     */
    max?: number;
    /**
     * The small step value of the input element when incrementing while the meta key is held. Snaps
     * to multiples of this value.
     * @default 0.1
     */
    smallStep?: number;
    /**
     * Amount to increment and decrement with the buttons and arrow keys,
     * or to scrub with pointer movement in the scrub area.
     * @default 1;
     */
    step?: number;
    /**
     * The large step value of the input element when incrementing while the shift key is held. Snaps
     * to multiples of this value.
     * @default 10
     */
    largeStep?: number;
    /**
     * Whether the user must enter a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the field is forcefully marked as invalid.
     * @default false
     */
    invalid?: boolean;
    /**
     * Whether to focus the element on page load.
     * @default false
     */
    autoFocus?: boolean;
    /**
     * Whether the user should be unable to change the field value.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The raw numeric value of the field.
     */
    value?: number | null;
    /**
     * The uncontrolled value of the field when it’s initially rendered.
     *
     * To render a controlled number field, use the `value` prop instead.
     */
    defaultValue?: number;
    /**
     * Whether to allow the user to scrub the input value with the mouse wheel while focused and
     * hovering over the input.
     * @default false
     */
    allowWheelScrub?: boolean;
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * Callback fired when the number value changes.
     * @param {number | null} value The new value.
     * @param {Event} event The event that triggered the change.
     */
    onValueChange?: (value: number | null, event?: Event) => void;
    /**
     * The locale of the input element.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
  }

  export interface ReturnValue {
    getScrubAreaProps: (
      externalProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
    inputValue: string;
    value: number | null;
    isScrubbing: boolean;
    isTouchInput: boolean;
    isPointerLockDenied: boolean;
    scrubHandleRef: React.RefObject<ScrubHandle | null>;
    scrubAreaRef: React.RefObject<HTMLSpanElement | null>;
    scrubAreaCursorRef: React.RefObject<HTMLSpanElement | null>;
    startAutoChange: (isIncrement: boolean) => void;
    stopAutoChange: () => void;
    minWithDefault: number;
    maxWithDefault: number;
    disabled: boolean;
    readOnly: boolean;
    id: string | undefined;
    setValue: (unvalidatedValue: number | null, event?: Event) => void;
    getStepAmount: () => number | undefined;
    incrementValue: (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: Event,
    ) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    mergedRef: ((instance: HTMLInputElement | null) => void) | null;
    allowInputSyncRef: React.RefObject<boolean | null>;
    formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
    valueRef: React.RefObject<number | null>;
    isPressedRef: React.RefObject<boolean | null>;
    intentionalTouchCheckTimeoutRef: React.RefObject<number | null>;
    movesAfterTouchRef: React.RefObject<number | null>;
    name: string | undefined;
    required: boolean;
    invalid: boolean;
    autoFocus: boolean;
    inputMode: InputMode;
    getAllowedNonNumericKeys: () => (string | undefined)[];
    min: number | undefined;
    max: number | undefined;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    locale?: Intl.LocalesArgument;
  }
}
