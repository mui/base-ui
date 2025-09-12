'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useInterval } from '@base-ui-components/utils/useInterval';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useForcedRerendering } from '@base-ui-components/utils/useForcedRerendering';
import { ownerDocument, ownerWindow } from '@base-ui-components/utils/owner';
import { isIOS } from '@base-ui-components/utils/detectBrowser';
import { InputMode, NumberFieldRootContext } from './NumberFieldRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { getNumberLocaleDetails, PERCENTAGES } from '../utils/parse';
import { formatNumber, formatNumberMaxPrecision } from '../../utils/formatNumber';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { CHANGE_VALUE_TICK_DELAY, DEFAULT_STEP, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { toValidatedNumber } from '../utils/validate';
import { EventWithOptionalKeyState } from '../utils/types';
import { BaseUIEventDetails, createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { isReactEvent } from '../../floating-ui-react/utils';

/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldRoot = React.forwardRef(function NumberFieldRoot(
  componentProps: NumberFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id: idProp,
    min,
    max,
    smallStep = 0.1,
    step = 1,
    largeStep = 10,
    required = false,
    disabled: disabledProp = false,
    readOnly = false,
    name: nameProp,
    defaultValue,
    value: valueProp,
    onValueChange: onValueChangeProp,
    allowWheelScrub = false,
    snapOnStep = false,
    format,
    locale,
    render,
    className,
    inputRef: inputRefProp,
    ...elementProps
  } = componentProps;

  const {
    setControlId,
    setDirty,
    validityData,
    setValidityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
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

  useIsoLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: valueProp,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = valueUnwrapped ?? null;
  const valueRef = useLatestRef(value);

  useIsoLayoutEffect(() => {
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

  useIsoLayoutEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [setValidityData, validityData.initialValue, value]);

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValue] = React.useState(() => {
    if (valueProp !== undefined) {
      return getControlledInputValue(value, locale, format);
    }
    return formatNumber(value, locale, format);
  });
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
      const nativeEvent = event && isReactEvent(event) ? event.nativeEvent : event;

      const details = createBaseUIEventDetails('none', nativeEvent);
      const validatedValue = toValidatedNumber(unvalidatedValue, {
        step: dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined,
        format: formatOptionsRef.current,
        minWithDefault,
        maxWithDefault,
        minWithZeroDefault,
        snapOnStep,
        small: eventWithOptionalKeyState?.altKey ?? false,
      });

      // Determine whether we should notify about a change even if the numeric value is unchanged.
      // This is needed when the user input is clamped/snapped to the same current value, or when
      // the source value differs but validation normalizes to the existing value.
      const shouldFireChange = validatedValue !== value || unvalidatedValue !== value;

      if (shouldFireChange) {
        onValueChange?.(validatedValue, details);

        if (details.isCanceled) {
          return;
        }

        setValueUnwrapped(validatedValue);
        setDirty(validatedValue !== validityData.initialValue);
      }

      // Keep the visible input in sync immediately when programmatic changes occur
      // (increment/decrement, wheel, etc). During direct typing we don't want
      // to overwrite the user-provided text until blur, so we gate on
      // `allowInputSyncRef`.
      if (allowInputSyncRef.current) {
        setInputValue(formatNumber(validatedValue, locale, format));
      }

      // Formatting can change even if the numeric value hasn't, so ensure a re-render when needed.
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
  useIsoLayoutEffect(function syncFormattedInputValueOnValueChange() {
    // This ensures the value is only updated on blur rather than every keystroke, but still
    // allows the input value to be updated when the value is changed externally.
    if (!allowInputSyncRef.current) {
      return;
    }

    const nextInputValue =
      valueProp !== undefined
        ? getControlledInputValue(value, locale, format)
        : formatNumber(value, locale, format);

    if (nextInputValue !== inputValue) {
      setInputValue(nextInputValue);
    }
  });

  useIsoLayoutEffect(
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

  const state: NumberFieldRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
      readOnly,
      required,
      value,
      inputValue,
      scrubbing: isScrubbing,
    }),
    [fieldState, disabled, readOnly, required, value, inputValue, isScrubbing],
  );

  const contextValue: NumberFieldRootContext = React.useMemo(
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
      state,
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
      state,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping,
  });

  return (
    <NumberFieldRootContext.Provider value={contextValue}>
      {element}
      {name && (
        <input
          type="hidden"
          name={name}
          ref={inputRefProp}
          value={value ?? ''}
          disabled={disabled}
          required={required}
        />
      )}
    </NumberFieldRootContext.Provider>
  );
});

export namespace NumberFieldRoot {
  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'onChange'> {
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
     */
    onValueChange?: (value: number | null, eventDetails: ChangeEventDetails) => void;
    /**
     * The locale of the input element.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export interface State extends FieldRoot.State {
    /**
     * The raw numeric value of the field.
     */
    value: number | null;
    /**
     * The formatted string value presented in the input element.
     */
    inputValue: string;
    /**
     * Whether the user must enter a value before submitting a form.
     */
    required: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to change the field value.
     */
    readOnly: boolean;
    /**
     * Whether the user is currently scrubbing the field.
     */
    scrubbing: boolean;
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}

function getControlledInputValue(
  value: number | null,
  locale: Intl.LocalesArgument,
  format: Intl.NumberFormatOptions | undefined,
) {
  const explicitPrecision =
    format?.maximumFractionDigits != null || format?.minimumFractionDigits != null;
  return explicitPrecision
    ? formatNumber(value, locale, format)
    : formatNumberMaxPrecision(value, locale, format);
}
