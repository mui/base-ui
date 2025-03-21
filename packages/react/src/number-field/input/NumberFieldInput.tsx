'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { fieldValidityMapping } from '../../field/utils/constants';
import { mergeProps } from '../../merge-props';
import { DEFAULT_STEP } from '../utils/constants';
import { ARABIC_RE, HAN_RE, getNumberLocaleDetails, parseNumber } from '../utils/parse';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  props: NumberFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;

  const {
    allowInputSyncRef,
    autoFocus,
    disabled,
    formatOptionsRef,
    getAllowedNonNumericKeys,
    getStepAmount,
    id,
    incrementValue,
    inputMode,
    inputValue,
    invalid,
    max,
    mergedRef,
    min,
    name,
    readOnly,
    required,
    setValue,
    state,
    valueRef,
    setInputValue,
    locale,
  } = useNumberFieldRootContext();

  const { labelId, validationMode, setTouched, setFocused } = useFieldRootContext();

  const {
    getInputValidationProps,
    getValidationProps,
    commitValidation,
    inputRef: inputValidationRef,
  } = useFieldControlValidation();

  const hasTouchedInputRef = React.useRef(false);

  const handleInputRef = useForkRef(forwardedRef, inputValidationRef, mergedRef);

  const getInputProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'input'>(
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

            const amount = getStepAmount(event) ?? DEFAULT_STEP;

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

  const mergedInputRef = useForkRef(forwardedRef, mergedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    ref: mergedInputRef,
    render: render ?? 'input',
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return renderElement();
});

namespace NumberFieldInput {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'input', State> {}
}

NumberFieldInput.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldInput };
