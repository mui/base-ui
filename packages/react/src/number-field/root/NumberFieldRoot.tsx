'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { ownerDocument } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import { activeElement } from '../../floating-ui-react/utils';
import { InputMode, NumberFieldRootContext } from './NumberFieldRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useFormContext } from '../../internals/form-context/FormContext';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import type { BaseUIComponentProps } from '../../internals/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  getFormatParts,
  getNumberLocaleDetails,
  PERMILLE,
  PERCENTAGES,
  SPACE_SEPARATOR_RE,
  BASE_NON_NUMERIC_SYMBOLS,
  MINUS_SIGNS_WITH_ASCII,
  PLUS_SIGNS_WITH_ASCII,
} from '../utils/parse';
import { formatNumber } from '../../utils/formatNumber';
import { toValidatedNumber } from '../utils/validate';
import { EventWithOptionalKeyState } from '../utils/types';
import type {
  ChangeEventCustomProperties,
  IncrementValueParameters,
  SetValueOptions,
  TextSource,
} from '../utils/types';
import {
  createChangeEventDetails,
  createGenericEventDetails,
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
  type ReasonToEvent,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

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
    form,
    name: nameProp,
    defaultValue = null,
    value: valueProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    defaultInputValue,
    inputValue: inputValueProp,
    onInputValueChange: onInputValueChangeProp,
    allowWheelScrub = false,
    snapOnStep = false,
    allowOutOfRange = false,
    format,
    locale,
    render,
    className,
    inputRef: inputRefProp,
    style,
    ...elementProps
  } = componentProps;

  const {
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    name: fieldName,
    state: fieldState,
    validation,
  } = useFieldRootContext();
  const { clearErrors } = useFormContext();

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

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

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

  // Written only by `setInputValue`, and only when a write actually lands, so a vetoed write can
  // never leave it describing text the input doesn't hold.
  const textSourceRef = React.useRef<TextSource>('value');
  const isTextUserAuthored = useStableCallback(() => textSourceRef.current === 'user');

  const lastChangedValueRef = React.useRef<number | null>(null);

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  //
  // Resolved once so that `useControlled` doesn't see a changing `default` (which would warn about
  // an uncontrolled component changing its default) as `value` or the format options change.
  const initialInputValue = useRefWithInit(
    () => defaultInputValue ?? formatNumber(value, locale, format),
  ).current;

  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: inputValueProp,
    default: initialInputValue,
    name: 'NumberField',
    state: 'inputValue',
  });

  // A single event can produce several writes before React re-renders (the blur handler stores a
  // clamped value, which syncs the text, and then normalizes the text again). Remembering the last
  // write keyed by its event dedupes those without outliving the event: a controlled `inputValue`
  // whose owner ignores a write leaves this ref holding a string the state never took, which would
  // otherwise swallow the next genuine change for that same string.
  const pendingWriteRef = React.useRef<{
    event: Event;
    value: string;
    applied: boolean;
  } | null>(null);

  // The last text this component proposed, whether or not it was accepted. Text on screen that
  // doesn't match it was supplied by a controlled `inputValue` owner, so it isn't ours to
  // re-derive.
  const lastProposedTextRef = useRefWithInit(() => formatNumber(value, locale, format));

  const previousFormattedValueRef = useRefWithInit(() => formatNumber(value, locale, format));

  // Hands the text back to `value` without touching what's on screen, given the text the field
  // would have shown. Used when an interaction that meant to reconcile the text was refused: the
  // edit stays put so it can be corrected, but the field keeps following `value`, so a later
  // `value`, `locale`, or `format` change still re-derives the text. Leaving the text marked as
  // the user's instead would pin it for the rest of the component's life.
  const releaseTextOwnership = useStableCallback((derivedText: string) => {
    textSourceRef.current = 'value';
    // Recorded as both "what we last proposed" and "what `value` last formatted to" so the sync
    // effect treats the text on screen as somebody else's until one of its inputs really changes.
    lastProposedTextRef.current = derivedText;
    previousFormattedValueRef.current = derivedText;
  });

  const setInputValue = useStableCallback(
    (nextInputValue: string, details: NumberFieldRoot.ChangeEventDetails, source: TextSource) => {
      // `useStableCallback` swaps the closure in an insertion effect, which runs before layout
      // effects, so `inputValue` is current even when called from the formatting sync effect.
      const pendingWrite =
        pendingWriteRef.current !== null && pendingWriteRef.current.event === details.event
          ? pendingWriteRef.current
          : null;
      const currentInputValue = pendingWrite !== null ? pendingWrite.value : inputValue;

      if (nextInputValue === currentInputValue) {
        // Nothing to write or report. Authorship transfers only when the input really does hold
        // this text: matching a proposal the consumer refused means it still holds the user's.
        if (pendingWrite === null || pendingWrite.applied) {
          textSourceRef.current = source;
        }
        return;
      }

      onInputValueChangeProp?.(nextInputValue, details);

      const applied = !details.isCanceled;

      // Recorded even when canceled: a refused proposal has still been put to the consumer, so
      // repeating it within the same event is noise. The event key keeps this from leaking into
      // the next interaction.
      pendingWriteRef.current = { event: details.event, value: nextInputValue, applied };
      lastProposedTextRef.current = nextInputValue;

      if (!applied) {
        // A refused proposal leaves the text where it is. When the field was reconciling the text
        // back to `value`, that refusal must not also stop it from following `value` — only a
        // refused keystroke keeps the text with the user.
        if (source === 'value') {
          releaseTextOwnership(nextInputValue);
        }
        return;
      }

      // Only a write that lands changes who owns the text, so a vetoed keystroke needs no undo.
      textSourceRef.current = source;
      setInputValueUnwrapped(nextInputValue);
    },
  );

  const [inputMode, setInputMode] = React.useState<InputMode>('numeric');

  const getAllowedNonNumericKeys = useStableCallback(() => {
    const parts = getFormatParts(locale, format);

    const keys = new Set<string>(BASE_NON_NUMERIC_SYMBOLS);
    const addAll = (chars: readonly string[]) => chars.forEach((char) => keys.add(char));

    // Integer formats omit the decimal from `parts`, so fall back to the locale's separator in that
    // case; it must stay typeable regardless of whether the format renders a fraction.
    const decimal =
      parts.find((part) => part.type === 'decimal')?.value ??
      getNumberLocaleDetails(locale, format).decimal;
    keys.add(decimal);

    // Allow every non-digit character the formatter renders — separators, currency symbols, units
    // (e.g. `km/h`, `°C`), exponent separators, and locale literals — decomposed per character
    // because the input validates the typed string one character at a time. Deriving these from
    // the formatter covers multi-character and locale-specific symbols of every part type
    // uniformly. `compact` suffixes (e.g. `K`/`M`) are excluded because `parseNumber` can't reverse
    // them, so allowing them would yield a silently incorrect value.
    parts.forEach((part) => {
      if (
        part.type === 'integer' ||
        part.type === 'fraction' ||
        part.type === 'exponentInteger' ||
        part.type === 'compact'
      ) {
        return;
      }
      addAll(Array.from(part.value));
      if (SPACE_SEPARATOR_RE.test(part.value)) {
        keys.add(' ');
      }
    });

    const allowPercentSymbols =
      formatStyle === 'percent' || (formatStyle === 'unit' && format?.unit === 'percent');
    const allowPermilleSymbols =
      formatStyle === 'percent' || (formatStyle === 'unit' && format?.unit === 'permille');

    // Tolerate percent/permille variants the formatter doesn't emit but users may type or paste.
    if (allowPercentSymbols) {
      addAll(PERCENTAGES);
    }
    if (allowPermilleSymbols) {
      addAll(PERMILLE);
    }

    // Allow plus sign in all cases; minus sign when negatives are valid, or when out-of-range
    // entry is allowed so native underflow validation can be triggered from the keyboard.
    addAll(PLUS_SIGNS_WITH_ASCII);
    if (minWithDefault < 0 || allowOutOfRange) {
      addAll(MINUS_SIGNS_WITH_ASCII);
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
    (
      unvalidatedValue: number | null,
      details: NumberFieldRoot.ChangeEventDetails,
      options?: SetValueOptions,
    ): boolean => {
      const eventWithOptionalKeyState = details.event as EventWithOptionalKeyState;
      const dir = details.direction;
      const projectText = options?.projectText ?? true;

      // Direct text entry (typing, pasting, clearing, autofill) behaves natively; step-based
      // interactions (keyboard arrows, buttons, wheel, scrub) do not. All direct-entry reasons
      // (`input-change`, `input-clear`, `input-blur`, `input-paste`) share the `input-` prefix.
      const isInputReason = details.reason.startsWith('input-') || details.reason === REASONS.none;

      // Only allow out-of-range values for direct text entry. Step-based interactions still clamp.
      const shouldClampValue = !allowOutOfRange || !isInputReason;

      const validatedValue = toValidatedNumber(
        unvalidatedValue,
        dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined,
        minWithDefault,
        maxWithDefault,
        minWithZeroDefault,
        formatOptionsRef.current,
        snapOnStep,
        eventWithOptionalKeyState?.altKey ?? false,
        shouldClampValue,
      );

      // Notify about a change even when the numeric value is unchanged for input reasons: the
      // typed text may clamp/snap to the current value, or differ while validation normalizes
      // it back to the existing value.
      const shouldFireChange =
        validatedValue !== value ||
        (isInputReason && (unvalidatedValue !== value || textSourceRef.current === 'user'));

      if (shouldFireChange) {
        onValueChangeProp?.(validatedValue, details);

        if (details.isCanceled) {
          // Report a vetoed change as not applied, so callers don't commit a value never stored.
          return false;
        }

        setValueUnwrapped(validatedValue);
        setDirty(validatedValue !== validityData.initialValue);
        hasPendingCommitRef.current = true;
      }

      lastChangedValueRef.current = validatedValue;

      // Reconcile the visible text with the value just stored. Direct text entry opts out: the
      // caller has already written what the user authored, and overwriting it mid-edit would
      // fight the keystroke.
      if (projectText) {
        // A separate details object so that canceling the text update can't retroactively cancel
        // the numeric change that was already applied above.
        setInputValue(
          formatNumber(validatedValue, locale, format),
          createChangeEventDetails(details.reason, details.event, details.trigger, {
            direction: dir,
          }),
          'value',
        );
      }

      // Formatting can change even if the numeric value hasn't, so ensure a re-render when needed.
      forceRender();

      return shouldFireChange;
    },
  );

  const incrementValue = useStableCallback(
    (amount: number, { direction, currentValue, event, reason }: IncrementValueParameters) => {
      const prevValue = currentValue == null ? valueRef.current : currentValue;
      const nativeEvent = event as ReasonToEvent<IncrementValueParameters['reason']> | undefined;

      if (typeof prevValue !== 'number') {
        // Seed an empty field with 0; `setValue` clamps it to the in-range value nearest 0
        // (e.g. `max` for a negative range). No `direction`: the seed isn't a step, so it must
        // not be directionally snapped.
        return setValue(0, createChangeEventDetails(reason, nativeEvent));
      }

      return setValue(
        prevValue + amount * direction,
        createChangeEventDetails(reason, nativeEvent, undefined, {
          direction,
        }),
      );
    },
  );

  // Re-derives the text when `value`, `locale`, or `format` change from outside an interaction.
  // Interactions reconcile their own text through `setValue`, so this effect only has to cover
  // external changes.
  // This is done inside a layout effect as an alternative to the technique to set state during
  // render as we're accessing a ref, which must be inside an effect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  //
  // It deliberately has no dependency array: it must run even when the parsed value hasn't changed,
  // since the same value can still be formatted differently.
  useIsoLayoutEffect(function syncFormattedInputValueOnValueChange() {
    // The user owns the text until an interaction reconciles it. Formatting stays behind this
    // guard so typing doesn't pay for a result that is discarded.
    if (textSourceRef.current === 'user') {
      return;
    }

    const nextInputValue = formatNumber(value, locale, format);
    const formattedValueChanged = nextInputValue !== previousFormattedValueRef.current;
    previousFormattedValueRef.current = nextInputValue;

    if (nextInputValue === inputValue) {
      return;
    }

    // The effect runs on every render (formatting can change without `value` changing), so it must
    // only push text derived from `value` when there's a reason to: either the formatted value
    // itself changed, or the text on screen is text this component wrote for a value that was
    // never stored, because a controlled `value` owner refused the change. Text a controlled
    // `inputValue` owner supplied — an intermediate string like `"-"`, which no number formats
    // to — is neither, and would otherwise be overwritten on the very next render.
    if (!formattedValueChanged && inputValue !== lastProposedTextRef.current) {
      return;
    }

    setInputValue(nextInputValue, createChangeEventDetails(REASONS.none), 'value');
  });

  useIsoLayoutEffect(
    function setDynamicInputModeForIOS() {
      if (!platform.os.ios) {
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
    [minWithDefault],
  );

  // React attaches `onWheel` as a passive listener, so calling `preventDefault` there is ignored.
  // Attach a native (non-passive) `wheel` listener to the input instead to prevent page scrolling.
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
          activeElement(ownerDocument(inputRef.current)) !== inputRef.current
        ) {
          return;
        }

        // Prevent the default behavior to avoid scrolling the page.
        event.preventDefault();

        const amount = getStepAmount(event);

        // Each wheel turn is a discrete, final change, so commit it immediately like keyboard
        // steps (gated on an actual change so boundary no-ops don't commit).
        const changed = incrementValue(amount, {
          direction: event.deltaY > 0 ? -1 : 1,
          event,
          reason: REASONS.wheel,
        });
        if (changed) {
          onValueCommitted(
            lastChangedValueRef.current,
            createGenericEventDetails(REASONS.wheel, event),
          );
        }
      }

      return addEventListener(element, 'wheel', handleWheel);
    },
    [
      allowWheelScrub,
      incrementValue,
      disabled,
      readOnly,
      getStepAmount,
      onValueCommitted,
      lastChangedValueRef,
      valueRef,
    ],
  );

  const state: NumberFieldRootState = React.useMemo(
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
      minWithDefault,
      maxWithDefault,
      id,
      setValue,
      incrementValue,
      getStepAmount,
      isTextUserAuthored,
      releaseTextOwnership,
      formatOptionsRef,
      valueRef,
      lastChangedValueRef,
      hasPendingCommitRef,
      name,
      nameProp,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
      locale,
      setIsScrubbing,
      state,
      onValueCommitted,
    }),
    [
      inputRef,
      minWithDefault,
      maxWithDefault,
      id,
      setValue,
      incrementValue,
      getStepAmount,
      isTextUserAuthored,
      releaseTextOwnership,
      formatOptionsRef,
      valueRef,
      name,
      nameProp,
      inputMode,
      getAllowedNonNumericKeys,
      min,
      max,
      setInputValue,
      locale,
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
        {...validation.getValidationProps(disabled, {
          onFocus() {
            inputRef.current?.focus();
          },
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/react/react/issues/9023
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }

            // Handle browser autofill.
            const nextValue = event.currentTarget.valueAsNumber;
            const parsedValue = Number.isNaN(nextValue) ? null : nextValue;
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

            // `setValue` updates the dirty flag from the stored (clamped) value, so validate with
            // that same value rather than the raw autofilled one.
            setValue(parsedValue, details);
            clearErrors(name);
            validation.change(lastChangedValueRef.current ?? parsedValue);
          },
        })}
        ref={hiddenInputRef}
        type="number"
        form={form}
        name={name}
        value={value ?? ''}
        min={min}
        max={max}
        // stepMismatch validation is broken unless an explicit `min` is added.
        // See https://github.com/react/react/issues/12334.
        step={stepProp}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-hidden
        tabIndex={-1}
        style={name ? visuallyHiddenInput : visuallyHidden}
        suppressHydrationWarning
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
   * When true, direct text entry may be outside the `min`/`max` range without clamping,
   * so native range underflow/overflow validation can occur.
   * Step-based interactions (keyboard arrows, buttons, wheel, scrub) still clamp.
   * @default false
   */
  allowOutOfRange?: boolean | undefined;
  /**
   * The small step value of the input element when incrementing while the alt key is held.
   * Snaps to multiples of this value when `snapOnStep` is enabled.
   * @default 0.1
   */
  smallStep?: number | undefined;
  /**
   * Amount to increment and decrement with the buttons and arrow keys, or to scrub with pointer movement in the scrub area.
   * To always enable step validation on form submission, specify the `min` prop explicitly in conjunction with this prop.
   * Specify `step="any"` to always disable step validation; interactive stepping then uses a base amount of `1`, while the alt and shift keys still step by `smallStep` and `largeStep`.
   * @default 1
   */
  step?: number | 'any' | undefined;
  /**
   * The large step value of the input element when incrementing while the shift key is held.
   * Snaps to multiples of this value when `snapOnStep` is enabled.
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
   * Identifies the form that owns the hidden input.
   * Useful when the number field is rendered outside the form.
   */
  form?: string | undefined;
  /**
   * The raw numeric value of the field.
   */
  value?: number | null | undefined;
  /**
   * The uncontrolled value of the field when it's initially rendered.
   *
   * To render a controlled number field, use the `value` prop instead.
   */
  defaultValue?: number | undefined;
  /**
   * The raw text shown in the input element.
   *
   * Unlike `value`, this can hold strings that aren't parseable as a number yet, such as `'-'` or
   * `'.'`, which lets the field be driven through intermediate states while typing.
   * The text is never formatted or clamped on the way in. It is reported back through
   * `onInputValueChange` either verbatim, as the user types, clears, or pastes, or formatted, on
   * blur, when stepping, and after an external `value`, `locale`, or `format` change.
   * Each call must either be mirrored back into this prop or refused with `eventDetails.cancel()`;
   * ignoring one keeps the old text while the rest of the change goes through.
   */
  inputValue?: string | undefined;
  /**
   * The uncontrolled raw text of the input element when it's initially rendered.
   * Defaults to the formatted `value`.
   *
   * To render a controlled input, use the `inputValue` prop instead.
   */
  defaultInputValue?: string | undefined;
  /**
   * Callback fired when the raw text shown in the input element changes.
   *
   * This fires for the same reasons as `onValueChange`, plus the cases that leave the numeric value
   * untouched, such as typing a lone `'-'`, and with `'none'` when the formatted text is refreshed
   * after an external `value`, `locale`, or `format` change. Text that isn't a number is reconciled
   * back to `value` on blur, under `'input-blur'`, however it got there.
   */
  onInputValueChange?:
    | ((inputValue: string, eventDetails: NumberFieldRoot.ChangeEventDetails) => void)
    | undefined;
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
   * - `'input-blur'` when formatting (and clamping, if enabled) occurs on blur
   * - `'input-paste'` for paste interactions
   * - `'keyboard'` for arrow-key/Home/End stepping (typing digits uses `'input-change'`/`'input-clear'`)
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
   * It runs simultaneously with `onValueChange` when interacting with the keyboard or the
   * mouse wheel.
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

export interface NumberFieldRootState extends FieldRootState {
  /**
   * The raw numeric value of the field.
   */
  value: number | null;
  /**
   * The raw text presented in the input element.
   * Formatted from `value` unless `inputValue` or `defaultInputValue` overrides it, in which case
   * it can be any string, including one that isn't parseable as a number.
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

// `none` is kept for consistency with other components even though the number field never
// commits with it.
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

export namespace NumberFieldRoot {
  export type State = NumberFieldRootState;
  export type Props = NumberFieldRootProps;
  export type ChangeEventReason = NumberFieldRootChangeEventReason;
  export type ChangeEventDetails = NumberFieldRootChangeEventDetails;
  export type CommitEventReason = NumberFieldRootCommitEventReason;
  export type CommitEventDetails = NumberFieldRootCommitEventDetails;
}
