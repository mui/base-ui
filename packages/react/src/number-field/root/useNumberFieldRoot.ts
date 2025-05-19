'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { toValidatedNumber } from '../utils/validate';
import { PERCENTAGES, getNumberLocaleDetails } from '../utils/parse';
import { CHANGE_VALUE_TICK_DELAY, DEFAULT_STEP, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { isIOS } from '../../utils/detectBrowser';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { useTimeout, Timeout } from '../../utils/useTimeout';
import { useInterval } from '../../utils/useInterval';
import { useControlled } from '../../utils/useControlled';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForcedRerendering } from '../../utils/useForcedRerendering';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLatestRef } from '../../utils/useLatestRef';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { EventWithOptionalKeyState } from '../utils/types';

export function useNumberFieldRoot(
  params: useNumberFieldRoot.Parameters,
): useNumberFieldRoot.ReturnValue {
  const {
    id: idProp,
    name: nameProp,
    min,
    max,
    smallStep = 0.1,
    step = 1,
    largeStep = 10,
    required = false,
    disabled: disabledProp = false,
    readOnly = false,
    allowWheelScrub = false,
    snapOnStep = false,
    format,
    value: externalValue,
    onValueChange: onValueChangeProp,
    defaultValue,
    locale,
  } = params;

  const {
    setControlId,
    setDirty,
    validityData,
    setValidityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
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

  useModernLayoutEffect(() => {
    setFilled(value !== null);
  }, [setFilled, value]);

  const forceRender = useForcedRerendering();

  const formatOptionsRef = useLatestRef(format);
  const onValueChange = useEventCallback(onValueChangeProp);

  const startTickTimeout = useTimeout();
  const tickInterval = useInterval();
  const intentionalTouchCheckTimeout = useTimeout();
  const isPressedRef = React.useRef(false);
  const movesAfterTouchRef = React.useRef(0);
  const allowInputSyncRef = React.useRef(true);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});

  useModernLayoutEffect(() => {
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

    const keys = new Set(['.', ',', decimal, group]);

    if (formatStyle === 'percent') {
      PERCENTAGES.forEach((key) => keys.add(key));
    }
    if (formatStyle === 'currency' && currency) {
      keys.add(currency);
    }
    if (minWithDefault < 0) {
      keys.add('-');
    }

    return keys;
  });

  const getStepAmount = useEventCallback((event?: EventWithOptionalKeyState) => {
    if (event?.altKey) {
      return smallStep;
    }
    if (event?.shiftKey) {
      return largeStep;
    }
    return step;
  });

  const setValue = useEventCallback(
    (unvalidatedValue: number | null, event?: React.MouseEvent | Event, dir?: 1 | -1) => {
      const eventWithOptionalKeyState = event as EventWithOptionalKeyState;
      const validatedValue = toValidatedNumber(unvalidatedValue, {
        step: dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined,
        format: formatOptionsRef.current,
        minWithDefault,
        maxWithDefault,
        minWithZeroDefault,
        snapOnStep,
        small: eventWithOptionalKeyState?.altKey ?? false,
      });

      onValueChange?.(validatedValue, event && 'nativeEvent' in event ? event.nativeEvent : event);
      setValueUnwrapped(validatedValue);
      setDirty(validatedValue !== validityData.initialValue);

      // We need to force a re-render, because while the value may be unchanged, the formatting may
      // be different. This forces the `useModernLayoutEffect` to run which acts as a single source of
      // truth to sync the input value.
      forceRender();
    },
  );

  const incrementValue = useEventCallback(
    (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: React.MouseEvent | Event,
    ) => {
      const prevValue = currentValue == null ? valueRef.current : currentValue;
      const nextValue =
        typeof prevValue === 'number' ? prevValue + amount * dir : Math.max(0, min ?? 0);
      setValue(nextValue, event, dir);
    },
  );

  const stopAutoChange = useEventCallback(() => {
    intentionalTouchCheckTimeout.clear();
    startTickTimeout.clear();
    tickInterval.clear();
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });

  const startAutoChange = useEventCallback(
    (isIncrement: boolean, triggerEvent?: React.MouseEvent | Event) => {
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
        const amount = getStepAmount(triggerEvent as EventWithOptionalKeyState) ?? DEFAULT_STEP;
        incrementValue(amount, isIncrement ? 1 : -1, undefined, triggerEvent);
      }

      tick();

      startTickTimeout.start(START_AUTO_CHANGE_DELAY, () => {
        tickInterval.start(CHANGE_VALUE_TICK_DELAY, tick);
      });
    },
  );

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
  useModernLayoutEffect(function syncFormattedInputValueOnValueChange() {
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

  useModernLayoutEffect(
    function setDynamicInputModeForIOS() {
      if (!isIOS) {
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

        const amount = getStepAmount(event) ?? DEFAULT_STEP;

        incrementValue(amount, event.deltaY > 0 ? -1 : 1, undefined, event);
      }

      element.addEventListener('wheel', handleWheel);

      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    },
    [allowWheelScrub, incrementValue, disabled, readOnly, largeStep, step, getStepAmount],
  );

  return React.useMemo(
    () => ({
      inputRef,
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
      intentionalTouchCheckTimeout,
      movesAfterTouchRef,
      name,
      required,
      invalid,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
      locale,
      isScrubbing,
      setIsScrubbing,
    }),
    [
      inputRef,
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
      intentionalTouchCheckTimeout,
      movesAfterTouchRef,
      name,
      required,
      invalid,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
      locale,
      isScrubbing,
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
     * @default 1
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
     * Whether the value should snap to the nearest step when incrementing or decrementing.
     * @default false
     */
    snapOnStep?: boolean;
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
    inputValue: string;
    value: number | null;
    startAutoChange: (isIncrement: boolean, event?: React.MouseEvent | Event) => void;
    stopAutoChange: () => void;
    minWithDefault: number;
    maxWithDefault: number;
    disabled: boolean;
    readOnly: boolean;
    id: string | undefined;
    setValue: (unvalidatedValue: number | null, event?: Event, dir?: 1 | -1) => void;
    getStepAmount: (event?: EventWithOptionalKeyState) => number | undefined;
    incrementValue: (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: Event,
    ) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    allowInputSyncRef: React.RefObject<boolean | null>;
    formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
    valueRef: React.RefObject<number | null>;
    isPressedRef: React.RefObject<boolean | null>;
    intentionalTouchCheckTimeout: Timeout;
    movesAfterTouchRef: React.RefObject<number | null>;
    name: string | undefined;
    required: boolean;
    invalid: boolean | undefined;
    inputMode: InputMode;
    getAllowedNonNumericKeys: () => Set<string | undefined>;
    min: number | undefined;
    max: number | undefined;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    locale: Intl.LocalesArgument;
    isScrubbing: boolean;
    setIsScrubbing: React.Dispatch<React.SetStateAction<boolean>>;
  }
}
