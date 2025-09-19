'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { stopEvent } from '../../floating-ui-react/utils';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { fieldValidityMapping } from '../../field/utils/constants';
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
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { stateAttributesMapping as numberFieldStateAttributesMapping } from '../utils/stateAttributesMapping';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { formatNumber, formatNumberMaxPrecision } from '../../utils/formatNumber';

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
  const { render, className, ...elementProps } = componentProps;

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
  const { labelId, validationMode, setTouched, setFocused, invalid } = useFieldRootContext();

  const {
    getInputValidationProps,
    getValidationProps,
    commitValidation,
    inputRef: inputValidationRef,
  } = useFieldControlValidation();

  const hasTouchedInputRef = React.useRef(false);
  const blockRevalidationRef = React.useRef(false);

  useField({
    id,
    commitValidation,
    value,
    controlRef: inputRef,
    name,
    getValue: () => value ?? null,
  });

  const prevValueRef = React.useRef(value);
  const prevInputValueRef = React.useRef(inputValue);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === value && prevInputValueRef.current === inputValue) {
      return;
    }

    clearErrors(name);

    if (validationMode === 'onChange') {
      commitValidation(value);
    }
  }, [value, inputValue, name, clearErrors, validationMode, commitValidation]);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === value || validationMode === 'onChange') {
      return;
    }

    if (blockRevalidationRef.current) {
      blockRevalidationRef.current = false;
      return;
    }
    commitValidation(value, true);
  }, [commitValidation, validationMode, value]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = value;
    prevInputValueRef.current = inputValue;
  }, [value, inputValue]);

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
    'aria-invalid': invalid || undefined,
    'aria-labelledby': labelId,
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    suppressHydrationWarning: true,
    onFocus(event) {
      if (event.defaultPrevented || readOnly || disabled || hasTouchedInputRef.current) {
        return;
      }

      hasTouchedInputRef.current = true;
      setFocused(true);

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
        setValue(null);
        if (validationMode === 'onBlur') {
          commitValidation(null);
        }
        onValueCommitted(null, createBaseUIEventDetails('none', event.nativeEvent));
        return;
      }

      const formatOptions = formatOptionsRef.current;
      const parsedValue = parseNumber(inputValue, locale, formatOptions);
      if (parsedValue === null) {
        return;
      }

      blockRevalidationRef.current = true;

      // If an explicit precision is requested, round the committed numeric value.
      const hasExplicitPrecision =
        formatOptions?.maximumFractionDigits != null ||
        formatOptions?.minimumFractionDigits != null;

      const maxFrac = formatOptions?.maximumFractionDigits;
      const committed =
        hasExplicitPrecision && typeof maxFrac === 'number'
          ? Number(parsedValue.toFixed(maxFrac))
          : parsedValue;

      const nextEventDetails = createBaseUIEventDetails('none', event.nativeEvent);
      const shouldUpdateValue = value !== committed;
      const shouldCommit = hadManualInput || shouldUpdateValue || hadPendingProgrammaticChange;

      if (validationMode === 'onBlur') {
        commitValidation(committed);
      }
      if (shouldUpdateValue) {
        setValue(committed, event.nativeEvent);
      }
      if (shouldCommit) {
        onValueCommitted(committed, nextEventDetails);
      }

      // Normalize only the displayed text
      const canonicalText = formatNumber(committed, locale, formatOptions);
      const maxPrecisionText = formatNumberMaxPrecision(parsedValue, locale, formatOptions);
      const shouldPreserveFullPrecision =
        !hasExplicitPrecision && parsedValue === value && inputValue === maxPrecisionText;

      if (!shouldPreserveFullPrecision && inputValue !== canonicalText) {
        setInputValue(canonicalText);
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

      // For trusted user typing, update the input text immediately and only fire onValueChange
      // if the typed value is currently parseable into a number. This preserves good UX for IME
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

      if (event.isTrusted) {
        setInputValue(targetValue);
        const parsedValue = parseNumber(targetValue, locale, formatOptionsRef.current);
        if (parsedValue !== null) {
          setValue(parsedValue, event.nativeEvent);
        }
        return;
      }

      const parsedValue = parseNumber(targetValue, locale, formatOptionsRef.current);

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

      let isAllowedNonNumericKey = allowedNonNumericKeys.has(event.key);

      const { decimal, currency, percentSign } = getNumberLocaleDetails(
        locale,
        formatOptionsRef.current,
      );

      const selectionStart = event.currentTarget.selectionStart;
      const selectionEnd = event.currentTarget.selectionEnd;
      const isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

      // Normalize handling of plus/minus signs via precomputed regexes
      const selectionIsExactlyCharAt = (index: number) =>
        selectionStart === index && selectionEnd === index + 1;

      if (
        ANY_MINUS_DETECT_RE.test(event.key) &&
        Array.from(allowedNonNumericKeys).some((k) => ANY_MINUS_DETECT_RE.test(k || ''))
      ) {
        // Only allow one sign unless replacing the existing one or all text is selected
        const existingIndex = inputValue.search(ANY_MINUS_RE);
        const isReplacingExisting =
          existingIndex != null && existingIndex !== -1 && selectionIsExactlyCharAt(existingIndex);
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
          existingIndex != null && existingIndex !== -1 && selectionIsExactlyCharAt(existingIndex);
        isAllowedNonNumericKey =
          !(ANY_MINUS_DETECT_RE.test(inputValue) || ANY_PLUS_DETECT_RE.test(inputValue)) ||
          isAllSelected ||
          isReplacingExisting;
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

      const isAsciiDigit = event.key >= '0' && event.key <= '9';
      const isArabicNumeral = ARABIC_DETECT_RE.test(event.key);
      const isHanNumeral = HAN_DETECT_RE.test(event.key);
      const isFullwidthNumeral = FULLWIDTH_DETECT_RE.test(event.key);
      const isNavigateKey = NAVIGATE_KEYS.has(event.key);

      if (
        // Allow composition events (e.g., pinyin)
        // event.nativeEvent.isComposing does not work in Safari:
        // https://bugs.webkit.org/show_bug.cgi?id=165004
        event.which === 229 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isAllowedNonNumericKey ||
        isAsciiDigit ||
        isArabicNumeral ||
        isFullwidthNumeral ||
        isHanNumeral ||
        isNavigateKey
      ) {
        return;
      }

      // We need to commit the number at this point if the input hasn't been blurred.
      const parsedValue = parseNumber(inputValue, locale, formatOptionsRef.current);

      const amount = getStepAmount(event) ?? DEFAULT_STEP;

      // Prevent insertion of text or caret from moving.
      stopEvent(event);

      const details = createBaseUIEventDetails('none', nativeEvent);

      if (event.key === 'ArrowUp') {
        incrementValue(amount, 1, parsedValue, nativeEvent);
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, details);
      } else if (event.key === 'ArrowDown') {
        incrementValue(amount, -1, parsedValue, nativeEvent);
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, details);
      } else if (event.key === 'Home' && min != null) {
        setValue(min, nativeEvent);
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, details);
      } else if (event.key === 'End' && max != null) {
        setValue(max, nativeEvent);
        onValueCommitted(lastChangedValueRef.current ?? valueRef.current, details);
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
      const parsedValue = parseNumber(pastedData, locale, formatOptionsRef.current);

      if (parsedValue !== null) {
        allowInputSyncRef.current = false;
        setValue(parsedValue, event.nativeEvent);
        setInputValue(pastedData);
      }
    },
  };

  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, inputRef, inputValidationRef],
    state,
    props: [inputProps, getInputValidationProps(), getValidationProps(), elementProps],
    stateAttributesMapping,
  });

  return element;
});

export namespace NumberFieldInput {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * A string value that provides a user-friendly name for the role of the input.
     * @default 'Number field'
     */
    'aria-roledescription'?: React.AriaAttributes['aria-roledescription'] | undefined;
  }
}
