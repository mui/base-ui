'use client';
import * as React from 'react';
import { DEFAULT_STEP } from '../utils/constants';
import { ARABIC_RE, HAN_RE, getNumberLocaleDetails, parseNumber } from '../utils/parse';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { InputMode } from '../root/useNumberFieldRoot';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';

export function useNumberFieldInput(
  params: useNumberFieldInput.Parameters,
): useNumberFieldInput.ReturnValue {
  const {
    name,
    required,
    invalid,
    autoFocus,
    disabled,
    incrementValue,
    id,
    inputValue,
    mergedRef,
    readOnly,
    setValue,
    inputMode,
    formatOptionsRef,
    valueRef,
    getStepAmount,
    getAllowedNonNumericKeys,
    min,
    max,
    allowInputSyncRef,
    setInputValue,
    locale,
    inputRef: externalInputRef,
  } = params;

  const { labelId, validationMode, setTouched, setFocused } = useFieldRootContext();

  const {
    getInputValidationProps,
    getValidationProps,
    commitValidation,
    inputRef: inputValidationRef,
  } = useFieldControlValidation();

  const hasTouchedInputRef = React.useRef(false);

  const handleInputRef = useForkRef(externalInputRef, inputValidationRef, mergedRef);

  const getInputProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(
        {
          id,
          required,
          autoFocus,
          name,
          disabled,
          readOnly,
          inputMode,
          value: inputValue,
          ref: handleInputRef,
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

            if (validationMode === 'onBlur') {
              commitValidation(valueRef.current);
            }

            allowInputSyncRef.current = true;

            if (inputValue.trim() === '') {
              setValue(null);
              return;
            }

            const parsedValue = parseNumber(inputValue, locale, formatOptionsRef.current);

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
              // event.nativeEvent.isComposing does not work in Safari:
              // https://bugs.webkit.org/show_bug.cgi?id=165004
              event.which === 229 ||
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
            const parsedValue = parseNumber(inputValue, locale, formatOptionsRef.current);

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
            const parsedValue = parseNumber(pastedData, locale, formatOptionsRef.current);

            if (parsedValue !== null) {
              allowInputSyncRef.current = false;
              setValue(parsedValue, event.nativeEvent);
              setInputValue(pastedData);
            }
          },
        },
        getInputValidationProps(getValidationProps(externalProps)),
      ),
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
      inputValue,
      invalid,
      labelId,
      setFocused,
      setTouched,
      validationMode,
      formatOptionsRef,
      commitValidation,
      valueRef,
      setValue,
      getAllowedNonNumericKeys,
      getStepAmount,
      min,
      max,
      incrementValue,
      setInputValue,
      allowInputSyncRef,
      locale,
      handleInputRef,
    ],
  );

  return React.useMemo(
    () => ({
      getInputProps,
    }),
    [getInputProps],
  );
}

export namespace useNumberFieldInput {
  export interface Parameters {
    name: string | undefined;
    required: boolean;
    invalid: boolean;
    autoFocus: boolean;
    disabled: boolean;
    incrementValue: (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: Event,
    ) => void;
    id: string | undefined;
    inputMode: InputMode;
    inputValue: string;
    mergedRef: ((instance: HTMLInputElement | null) => void) | null;
    readOnly: boolean;
    setValue: (unvalidatedValue: number | null, event?: Event) => void;
    formatOptionsRef: React.RefObject<Intl.NumberFormatOptions | undefined>;
    valueRef: React.RefObject<number | null>;
    getStepAmount: () => number | undefined;
    getAllowedNonNumericKeys: () => (string | undefined)[];
    min: number | undefined;
    max: number | undefined;
    allowInputSyncRef: React.RefObject<boolean | null>;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    locale?: Intl.LocalesArgument;
    inputRef: React.Ref<HTMLInputElement>;
  }

  export interface ReturnValue {
    getInputProps: (
      externalProps?: React.ComponentPropsWithRef<'input'>,
    ) => React.ComponentPropsWithRef<'input'>;
  }
}
