'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useInterval } from '@base-ui/utils/useInterval';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isIOS } from '@base-ui/utils/detectBrowser';
import { InputMode, NumberFieldRootContext } from './NumberFieldRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import type { BaseUIComponentProps } from '../../utils/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  getNumberLocaleDetails,
  PERMILLE,
  PERCENTAGES,
  SPACE_SEPARATOR_RE,
  BASE_NON_NUMERIC_SYMBOLS,
  MINUS_SIGNS_WITH_ASCII,
  PLUS_SIGNS_WITH_ASCII,
} from '../utils/parse';
import { formatNumber, formatNumberMaxPrecision } from '../../utils/formatNumber';
import { CHANGE_VALUE_TICK_DELAY, DEFAULT_STEP, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { toValidatedNumber } from '../utils/validate';
import { EventWithOptionalKeyState } from '../utils/types';
import type { ChangeEventCustomProperties, IncrementValueParameters } from '../utils/types';
import {
  createChangeEventDetails,
  createGenericEventDetails,
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
  type ReasonToEvent,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

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
    step: stepProp = 1,
    largeStep = 10,
    required = false,
    disabled: disabledProp = false,
    readOnly = false,
    name: nameProp,
    defaultValue,
    value: valueProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
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
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
    validation,
    shouldValidateOnChange,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const step = stepProp === 'any' ? 1 : stepProp;

  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = min ?? 0;
  const formatStyle = format?.style;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const hiddenInputRef = useMergedRefs(inputRefProp, validation.inputRef);

  const id = useLabelableId({ id: idProp });

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: valueProp,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = valueUnwrapped ?? null;
  const valueRef = useValueAsRef(value);

  useIsoLayoutEffect(() => {
    setFilled(value !== null);
  }, [setFilled, value]);

  const forceRender = useForcedRerendering();

  const formatOptionsRef = useValueAsRef(format);

  const hasPendingCommitRef = React.useRef(false);

  const onValueCommitted = useStableCallback(
    (nextValue: number | null, eventDetails: NumberFieldRoot.CommitEventDetails) => {
      hasPendingCommitRef.current = false;
      onValueCommittedProp?.(nextValue, eventDetails);
    },
  );

  const startTickTimeout = useTimeout();
  const tickInterval = useInterval();
  const intentionalTouchCheckTimeout = useTimeout();

  const isPressedRef = React.useRef(false);
  const movesAfterTouchRef = React.useRef(0);
  const allowInputSyncRef = React.useRef(true);
  const lastChangedValueRef = React.useRef<number | null>(null);
  const unsubscribeFromGlobalContextMenuRef = React.useRef<() => void>(() => {});

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

  const getAllowedNonNumericKeys = useStableCallback(() => {
    const { decimal, group, currency, literal } = getNumberLocaleDetails(locale, format);

    const keys = new Set<string>();
    BASE_NON_NUMERIC_SYMBOLS.forEach((symbol) => keys.add(symbol));
    if (decimal) {
      keys.add(decimal);
    }
    if (group) {
      keys.add(group);
      if (SPACE_SEPARATOR_RE.test(group)) {
        keys.add(' ');
      }
    }

    const allowPercentSymbols =
      formatStyle === 'percent' || (formatStyle === 'unit' && format?.unit === 'percent');
    const allowPermilleSymbols =
      formatStyle === 'percent' || (formatStyle === 'unit' && format?.unit === 'permille');

    if (allowPercentSymbols) {
      PERCENTAGES.forEach((key) => keys.add(key));
    }
    if (allowPermilleSymbols) {
      PERMILLE.forEach((key) => keys.add(key));
    }

    if (formatStyle === 'currency' && currency) {
      keys.add(currency);
    }

    if (literal) {
      // Some locales (e.g. de-DE) insert a literal space character between the number
      // and the symbol, so allow those characters to be typed/removed.
      Array.from(literal).forEach((char) => keys.add(char));
      if (SPACE_SEPARATOR_RE.test(literal)) {
        keys.add(' ');
      }
    }

    // Allow plus sign in all cases; minus sign only when negatives are valid
    PLUS_SIGNS_WITH_ASCII.forEach((key) => keys.add(key));
    if (minWithDefault < 0) {
      MINUS_SIGNS_WITH_ASCII.forEach((key) => keys.add(key));
    }

    return keys;
  });

  const getStepAmount = useStableCallback((event?: EventWithOptionalKeyState) => {
    if (event?.altKey) {
      return smallStep;
    }
    if (event?.shiftKey) {
      return largeStep;
    }
    return step;
  });

  const setValue = useStableCallback(
    (unvalidatedValue: number | null, details: NumberFieldRoot.ChangeEventDetails) => {
      const eventWithOptionalKeyState = details.event as EventWithOptionalKeyState;
      const dir = details.direction;

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
      const shouldFireChange =
        validatedValue !== value ||
        unvalidatedValue !== value ||
        allowInputSyncRef.current === false;

      if (shouldFireChange) {
        lastChangedValueRef.current = validatedValue;
        onValueChangeProp?.(validatedValue, details);

        if (details.isCanceled) {
          return;
        }

        setValueUnwrapped(validatedValue);
        setDirty(validatedValue !== validityData.initialValue);
        hasPendingCommitRef.current = true;
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

  const incrementValue = useStableCallback(
    (amount: number, { direction, currentValue, event, reason }: IncrementValueParameters) => {
      const prevValue = currentValue == null ? valueRef.current : currentValue;
      const nextValue =
        typeof prevValue === 'number' ? prevValue + amount * direction : Math.max(0, min ?? 0);
      const nativeEvent = event as ReasonToEvent<IncrementValueParameters['reason']> | undefined;
      setValue(
        nextValue,
        createChangeEventDetails(reason, nativeEvent, undefined, {
          direction,
        }),
      );
    },
  );

  const stopAutoChange = useStableCallback(() => {
    intentionalTouchCheckTimeout.clear();
    startTickTimeout.clear();
    tickInterval.clear();
    unsubscribeFromGlobalContextMenuRef.current();
    movesAfterTouchRef.current = 0;
  });

  const startAutoChange = useStableCallback(
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
        (event) => {
          isPressedRef.current = false;
          stopAutoChange();
          const committed = lastChangedValueRef.current ?? valueRef.current;
          const commitReason = isIncrement ? 'increment' : 'decrement';
          onValueCommitted(committed, createGenericEventDetails(commitReason, event));
        },
        { once: true },
      );

      function tick() {
        const amount = getStepAmount(triggerEvent as EventWithOptionalKeyState) ?? DEFAULT_STEP;
        incrementValue(amount, {
          direction: isIncrement ? 1 : -1,
          event: triggerEvent,
          reason: isIncrement ? 'increment-press' : 'decrement-press',
        });
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

        incrementValue(amount, {
          direction: event.deltaY > 0 ? -1 : 1,
          event,
          reason: 'wheel',
        });
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
      lastChangedValueRef,
      hasPendingCommitRef,
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
      onValueCommitted,
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
      formatOptionsRef,
      valueRef,
      intentionalTouchCheckTimeout,
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
      onValueCommitted,
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
      <input
        {...validation.getInputValidationProps({
          onFocus() {
            inputRef.current?.focus();
          },
          onChange(event) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            // Handle browser autofill.
            const nextValue = event.currentTarget.valueAsNumber;
            const parsedValue = Number.isNaN(nextValue) ? null : nextValue;
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

            setDirty(parsedValue !== validityData.initialValue);
            setValue(parsedValue, details);

            if (shouldValidateOnChange()) {
              validation.commit(parsedValue);
            }
          },
        })}
        ref={hiddenInputRef}
        type="number"
        name={name}
        value={value ?? ''}
        min={min}
        max={max}
        // stepMismatch validation is broken unless an explicit `min` is added.
        // See https://github.com/facebook/react/issues/12334.
        step={stepProp}
        disabled={disabled}
        required={required}
        aria-hidden
        tabIndex={-1}
        style={name ? visuallyHiddenInput : visuallyHidden}
      />
    </NumberFieldRootContext.Provider>
  );
});

export interface NumberFieldRootProps extends Omit<
  BaseUIComponentProps<'div', NumberFieldRootState>,
  'onChange'
> {
  /**
   * The id of the input element.
   */
  id?: string | undefined;
  /**
   * The minimum value of the input element.
   */
  min?: number | undefined;
  /**
   * The maximum value of the input element.
   */
  max?: number | undefined;
  /**
   * The small step value of the input element when incrementing while the meta key is held. Snaps
   * to multiples of this value.
   * @default 0.1
   */
  smallStep?: number | undefined;
  /**
   * Amount to increment and decrement with the buttons and arrow keys, or to scrub with pointer movement in the scrub area.
   * To always enable step validation on form submission, specify the `min` prop explicitly in conjunction with this prop.
   * Specify `step="any"` to always disable step validation.
   * @default 1
   */
  step?: (number | 'any') | undefined;
  /**
   * The large step value of the input element when incrementing while the shift key is held. Snaps
   * to multiples of this value.
   * @default 10
   */
  largeStep?: number | undefined;
  /**
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * The raw numeric value of the field.
   */
  value?: (number | null) | undefined;
  /**
   * The uncontrolled value of the field when it’s initially rendered.
   *
   * To render a controlled number field, use the `value` prop instead.
   */
  defaultValue?: number | undefined;
  /**
   * Whether to allow the user to scrub the input value with the mouse wheel while focused and
   * hovering over the input.
   * @default false
   */
  allowWheelScrub?: boolean | undefined;
  /**
   * Whether the value should snap to the nearest step when incrementing or decrementing.
   * @default false
   */
  snapOnStep?: boolean | undefined;
  /**
   * Options to format the input value.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * Callback fired when the number value changes.
   *
   * The `eventDetails.reason` indicates what triggered the change:
   * - `'input-change'` for parseable typing or programmatic text updates
   * - `'input-clear'` when the field becomes empty
   * - `'input-blur'` when formatting or clamping occurs on blur
   * - `'input-paste'` for paste interactions
   * - `'keyboard'` for keyboard input
   * - `'increment-press'` / `'decrement-press'` for button presses on the increment and decrement controls
   * - `'wheel'` for wheel-based scrubbing
   * - `'scrub'` for scrub area drags
   */
  onValueChange?:
    | ((value: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Callback function that is fired when the value is committed.
   * It runs later than `onValueChange`, when:
   * - The input is blurred after typing a value.
   * - The pointer is released after scrubbing or pressing the increment/decrement buttons.
   *
   * It runs simultaneously with `onValueChange` when interacting with the keyboard.
   *
   * **Warning**: This is a generic event not a change event.
   */
  onValueCommitted?:
    | ((value: number | null, eventDetails: NumberFieldRoot.CommitEventDetails) => void)
    | undefined;
  /**
   * The locale of the input element.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
}

export interface NumberFieldRootState extends FieldRoot.State {
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

export type NumberFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.inputBlur
  | typeof REASONS.inputPaste
  | typeof REASONS.keyboard
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.wheel
  | typeof REASONS.scrub
  | typeof REASONS.none;
export type NumberFieldRootChangeEventDetails = BaseUIChangeEventDetails<
  NumberFieldRootChangeEventReason,
  ChangeEventCustomProperties
>;

export type NumberFieldRootCommitEventReason =
  | typeof REASONS.inputBlur
  | typeof REASONS.inputClear
  | typeof REASONS.keyboard
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.wheel
  | typeof REASONS.scrub
  | typeof REASONS.none;
export type NumberFieldRootCommitEventDetails =
  BaseUIGenericEventDetails<NumberFieldRoot.CommitEventReason>;

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

export namespace NumberFieldRoot {
  export type State = NumberFieldRootState;
  export type Props = NumberFieldRootProps;
  export type ChangeEventReason = NumberFieldRootChangeEventReason;
  export type ChangeEventDetails = NumberFieldRootChangeEventDetails;
  export type CommitEventReason = NumberFieldRootCommitEventReason;
  export type CommitEventDetails = NumberFieldRootCommitEventDetails;
}
