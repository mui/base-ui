'use client';
import * as React from 'react';
import { SafeReact } from '@base-ui/utils/safeReact';
import { warn } from '@base-ui/utils/warn';
import { stopEvent } from '../../floating-ui-react/utils';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import { useFormContext } from '../../internals/form-context/FormContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { DEFAULT_STEP } from '../utils/constants';
import {
  ARABIC_DETECT_RE,
  PERSIAN_DETECT_RE,
  HAN_DETECT_RE,
  FULLWIDTH_DETECT_RE,
  getNumberLocaleDetails,
  parseNumber,
  ANY_MINUS_RE,
  ANY_PLUS_RE,
  ANY_MINUS_DETECT_RE,
  ANY_PLUS_DETECT_RE,
} from '../utils/parse';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import { stateAttributesMapping as numberFieldStateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { formatNumber } from '../../utils/formatNumber';
import { useValueChanged } from '../../internals/useValueChanged';
import { REASONS } from '../../internals/reasons';
import { hasNumberFormatRoundingOptions, removeFloatingPointErrors } from '../utils/validate';

const stateAttributesMapping = {
  ...fieldValidityMapping,
  ...numberFieldStateAttributesMapping,
};

const NAVIGATE_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Enter',
  'Escape',
]);

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  componentProps: NumberFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const {
    allowInputSyncRef,
    disabled,
    formatOptionsRef,
    getAllowedNonNumericKeys,
    getStepAmount,
    id,
    incrementValue,
    inputMode,
    inputValue,
    max,
    min,
    name,
    nameProp,
    readOnly,
    required,
    setValue,
    state,
    setInputValue,
    locale,
    inputRef,
    value,
    onValueCommitted,
    lastChangedValueRef,
    hasPendingCommitRef,
    valueRef,
  } = useNumberFieldRootContext();

  const { clearErrors } = useFormContext();
  const { validationMode, setTouched, setFocused, invalid, shouldValidateOnChange, validation } =
    useFieldRootContext();
  const { labelId } = useLabelableContext();

  const hasTouchedInputRef = React.useRef(false);
  const blockRevalidationRef = React.useRef(false);

  useRegisterFieldControl(inputRef, id, value, undefined, !disabled, nameProp);

  useValueChanged(value, () => {
    clearErrors(name);

    if (blockRevalidationRef.current && !shouldValidateOnChange()) {
      blockRevalidationRef.current = false;
      return;
    }

    validation.change(value);
  });

  const inputProps: React.ComponentProps<'input'> = {
    id,
    required,
    disabled,
    readOnly,
    inputMode,
    value: inputValue,
    type: 'text',
    autoComplete: 'off',
    autoCorrect: 'off',
    spellCheck: 'false',
    'aria-roledescription': 'Number field',
    'aria-invalid': !disabled && invalid ? true : undefined,
    'aria-labelledby': labelId,
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    suppressHydrationWarning: true,
    onFocus(event) {
      if (event.defaultPrevented || readOnly || disabled) {
        return;
      }

      setFocused(true);

      if (hasTouchedInputRef.current) {
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
      setFocused(false);

      const hadManualInput = !allowInputSyncRef.current;
      const hadPendingProgrammaticChange = hasPendingCommitRef.current;

      allowInputSyncRef.current = true;

      if (inputValue.trim() === '') {
        setValue(null, createChangeEventDetails(REASONS.inputClear, event.nativeEvent));
        if (validationMode === 'onBlur') {
          validation.commit(null);
        }
        onValueCommitted(null, createGenericEventDetails(REASONS.inputClear, event.nativeEvent));
        return;
      }

      const formatOptions = formatOptionsRef.current;
      const parsedValue = parseNumber(inputValue, locale, formatOptions);
      if (parsedValue === null) {
        return;
      }

      // Avoid applying Intl's default precision unless the format opts into rounding.
      const hasRoundingOptions = hasNumberFormatRoundingOptions(formatOptions);

      let committed: number | null;
      if (!hadManualInput && !hasRoundingOptions) {
        // No rounding options and no manual edit: the visible text is purely formatted
        // display, so keep the authoritative numeric value as-is rather than re-parsing the
        // rounded text and discarding precision (e.g. focus/blur with no edits, or blur after
        // a programmatic change).
        committed = value;
      } else if (hasRoundingOptions) {
        // Explicit rounding options apply to the committed value, whether typed or external.
        committed = removeFloatingPointErrors(parsedValue, formatOptions);
      } else {
        committed = parsedValue;
      }

      const nextEventDetails = createGenericEventDetails(REASONS.inputBlur, event.nativeEvent);
      const shouldUpdateValue = value !== committed;
      const shouldCommit = hadManualInput || shouldUpdateValue || hadPendingProgrammaticChange;

      // Use the stored value after `setValue` clamps it.
      let committedValue = committed;
      if (shouldUpdateValue) {
        const changeDetails = createChangeEventDetails(REASONS.inputBlur, event.nativeEvent);
        blockRevalidationRef.current = true;
        setValue(committed, changeDetails);
        if (changeDetails.isCanceled) {
          blockRevalidationRef.current = false;
          return;
        }
        committedValue = lastChangedValueRef.current ?? committed;
      }
      if (validationMode === 'onBlur') {
        validation.commit(committedValue);
      }
      if (shouldCommit) {
        onValueCommitted(committedValue, nextEventDetails);
      }

      // Normalize only the displayed text
      const canonicalText = formatNumber(committedValue, locale, formatOptions);
      if (inputValue !== canonicalText) {
        setInputValue(canonicalText);
      }
    },
    onChange(event) {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }

      allowInputSyncRef.current = false;
      const targetValue = event.currentTarget.value;

      if (targetValue.trim() === '') {
        setInputValue(targetValue);
        setValue(null, createChangeEventDetails(REASONS.inputClear, event.nativeEvent));
        return;
      }

      // Update the input text immediately and only fire onValueChange if the typed value is
      // currently parseable into a number. This preserves good UX for IME
      // composition/partial input while still providing live numeric updates when possible.
      const allowedNonNumericKeys = getAllowedNonNumericKeys();
      const isValidCharacterString = Array.from(targetValue).every((ch) => {
        const isAsciiDigit = ch >= '0' && ch <= '9';
        const isArabicNumeral = ARABIC_DETECT_RE.test(ch);
        const isHanNumeral = HAN_DETECT_RE.test(ch);
        const isPersianNumeral = PERSIAN_DETECT_RE.test(ch);
        const isFullwidthNumeral = FULLWIDTH_DETECT_RE.test(ch);
        const isMinus = ANY_MINUS_DETECT_RE.test(ch);
        return (
          isAsciiDigit ||
          isArabicNumeral ||
          isHanNumeral ||
          isPersianNumeral ||
          isFullwidthNumeral ||
          isMinus ||
          allowedNonNumericKeys.has(ch)
        );
      });

      if (!isValidCharacterString) {
        return;
      }

      const parsedValue = parseNumber(targetValue, locale, formatOptionsRef.current);

      setInputValue(targetValue);

      if (parsedValue !== null) {
        setValue(parsedValue, createChangeEventDetails(REASONS.inputChange, event.nativeEvent));
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented || readOnly || disabled) {
        return;
      }

      const nativeEvent = event.nativeEvent;

      allowInputSyncRef.current = true;

      const allowedNonNumericKeys = getAllowedNonNumericKeys();

      let isAllowedNonNumericKey = allowedNonNumericKeys.has(event.key);

      const { decimal, currency, percentSign } = getNumberLocaleDetails(
        locale,
        formatOptionsRef.current,
      );

      const selectionStart = event.currentTarget.selectionStart;
      const selectionEnd = event.currentTarget.selectionEnd;
      const isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

      // Normalize handling of plus/minus signs via precomputed regexes
      const selectionContainsIndex = (index: number) =>
        selectionStart != null &&
        selectionEnd != null &&
        index >= selectionStart &&
        index < selectionEnd;

      if (
        ANY_MINUS_DETECT_RE.test(event.key) &&
        Array.from(allowedNonNumericKeys).some((k) => ANY_MINUS_DETECT_RE.test(k || ''))
      ) {
        // Only allow one sign unless replacing the existing one or all text is selected
        const existingIndex = inputValue.search(ANY_MINUS_RE);
        const isReplacingExisting =
          existingIndex != null && existingIndex !== -1 && selectionContainsIndex(existingIndex);
        isAllowedNonNumericKey =
          !(ANY_MINUS_DETECT_RE.test(inputValue) || ANY_PLUS_DETECT_RE.test(inputValue)) ||
          isAllSelected ||
          isReplacingExisting;
      }
      if (
        ANY_PLUS_DETECT_RE.test(event.key) &&
        Array.from(allowedNonNumericKeys).some((k) => ANY_PLUS_DETECT_RE.test(k || ''))
      ) {
        const existingIndex = inputValue.search(ANY_PLUS_RE);
        const isReplacingExisting =
          existingIndex != null && existingIndex !== -1 && selectionContainsIndex(existingIndex);
        isAllowedNonNumericKey =
          !(ANY_MINUS_DETECT_RE.test(inputValue) || ANY_PLUS_DETECT_RE.test(inputValue)) ||
          isAllSelected ||
          isReplacingExisting;
      }

      // Only allow one of each symbol.
      [decimal, currency, percentSign].forEach((symbol) => {
        if (event.key === symbol) {
          const symbolIndex = inputValue.indexOf(symbol);
          const isSymbolHighlighted = selectionContainsIndex(symbolIndex);
          isAllowedNonNumericKey =
            !inputValue.includes(symbol) || isAllSelected || isSymbolHighlighted;
        }
      });

      const isAsciiDigit = event.key >= '0' && event.key <= '9';
      const isArabicNumeral = ARABIC_DETECT_RE.test(event.key);
      const isHanNumeral = HAN_DETECT_RE.test(event.key);
      const isPersianNumeral = PERSIAN_DETECT_RE.test(event.key);
      const isFullwidthNumeral = FULLWIDTH_DETECT_RE.test(event.key);
      const isNavigateKey = NAVIGATE_KEYS.has(event.key);
      // Alt+ArrowUp/ArrowDown selects smallStep, so don't treat it as a bypass modifier.
      const isStepKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';

      if (
        // Allow composition events (e.g., pinyin)
        // event.nativeEvent.isComposing does not work in Safari:
        // https://bugs.webkit.org/show_bug.cgi?id=165004
        event.which === 229 ||
        (event.altKey && !isStepKey) ||
        event.ctrlKey ||
        event.metaKey ||
        isAllowedNonNumericKey ||
        isAsciiDigit ||
        isArabicNumeral ||
        isFullwidthNumeral ||
        isHanNumeral ||
        isPersianNumeral ||
        isNavigateKey
      ) {
        return;
      }

      // Step from the authoritative numeric value unless the input has unsaved manual edits.
      // When the text is already synced, parsing the rounded display would collapse precision,
      // so pass no `currentValue` and let `incrementValue` fall back to the numeric state
      // (mirrors the button path).
      const currentValue = allowInputSyncRef.current
        ? null
        : parseNumber(inputValue, locale, formatOptionsRef.current);

      const amount = getStepAmount(event) ?? DEFAULT_STEP;

      // Prevent insertion of text or caret from moving.
      stopEvent(event);

      const commitDetails = createGenericEventDetails(REASONS.keyboard, nativeEvent);

      if (event.key === 'ArrowUp') {
        incrementValue(amount, {
          direction: 1,
          currentValue,
          event: nativeEvent,
          reason: REASONS.keyboard,
        });
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, commitDetails);
      } else if (event.key === 'ArrowDown') {
        incrementValue(amount, {
          direction: -1,
          currentValue,
          event: nativeEvent,
          reason: REASONS.keyboard,
        });
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, commitDetails);
      } else if (event.key === 'Home' && min != null) {
        setValue(min, createChangeEventDetails(REASONS.keyboard, nativeEvent));
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, commitDetails);
      } else if (event.key === 'End' && max != null) {
        setValue(max, createChangeEventDetails(REASONS.keyboard, nativeEvent));
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, commitDetails);
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || readOnly || disabled) {
        return;
      }

      let pastedData = '';

      try {
        pastedData = event.clipboardData?.getData('text/plain') ?? '';
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
          warn(
            '<NumberField.Input> could not read clipboard text during paste handling.',
            ownerStackMessage,
          );
        }

        return;
      }

      // Prevent `onChange` from being called.
      event.preventDefault();

      const parsedValue = parseNumber(pastedData, locale, formatOptionsRef.current);

      if (parsedValue !== null) {
        allowInputSyncRef.current = false;
        setValue(parsedValue, createChangeEventDetails(REASONS.inputPaste, event.nativeEvent));
        setInputValue(pastedData);
      }
    },
  };

  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, inputRef],
    state,
    props: [inputProps, elementProps, (props) => validation.getValidationProps(disabled, props)],
    stateAttributesMapping,
  });

  return element;
});

export interface NumberFieldInputState extends NumberFieldRootState {}

export interface NumberFieldInputProps extends BaseUIComponentProps<
  'input',
  NumberFieldInputState
> {
  /**
   * A string value that provides a user-friendly name for the role of the input.
   * @default 'Number field'
   */
  'aria-roledescription'?: React.AriaAttributes['aria-roledescription'] | undefined;
}

export namespace NumberFieldInput {
  export type State = NumberFieldInputState;
  export type Props = NumberFieldInputProps;
}
