'use client';
import * as React from 'react';
import { stopEvent } from '../../floating-ui-react/utils';
import {
  IndexGuessBehavior,
  useCompositeListItem,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useOTPFieldRootContext, getOTPFieldInputState } from '../root/OTPFieldRootContext';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import { inputStateAttributesMapping } from '../utils/stateAttributesMapping';
import {
  normalizeOTPValue,
  removeOTPCharacter,
  replaceOTPValue,
  stripOTPWhitespace,
} from '../utils/otp';

/**
 * An individual OTP character input.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export const OTPFieldInput = React.forwardRef(function OTPFieldInput(
  componentProps: OTPFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    activeIndex,
    autoComplete,
    disabled,
    form,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    inputMode,
    inputAriaLabelledBy,
    invalid,
    length,
    mask,
    pattern,
    reportValueInvalid,
    readOnly,
    required,
    sanitizeValue,
    setValue,
    state,
    validationType,
    value,
  } = useOTPFieldRootContext();

  const { ref: listItemRef, index } = useCompositeListItem({
    indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
  });

  const slotValue = value[index] ?? '';
  const inputState = getOTPFieldInputState(state, slotValue, index);

  const inputProps: React.ComponentProps<'input'> = {
    id: getInputId(index),
    value: slotValue,
    type: mask ? 'password' : 'text',
    inputMode,
    autoComplete: index === 0 ? autoComplete : 'off',
    autoCorrect: 'off',
    spellCheck: 'false',
    enterKeyHint: index === length - 1 ? 'done' : 'next',
    maxLength: index === 0 ? length : 1,
    tabIndex: activeIndex === index ? 0 : -1,
    disabled,
    form,
    pattern,
    readOnly,
    required,
    'aria-labelledby':
      componentProps['aria-label'] == null
        ? (componentProps['aria-labelledby'] ?? inputAriaLabelledBy)
        : undefined,
    'aria-invalid': invalid || undefined,
    'aria-label': componentProps['aria-label'],
    onMouseDown(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      event.preventDefault();
      focusInput(index);
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      if (index > value.length) {
        const nextIndex = Math.min(value.length, length - 1);
        focusInput(nextIndex);
        return;
      }

      handleInputFocus(index, event);
    },
    onBlur(event) {
      if (event.defaultPrevented) {
        return;
      }

      handleInputBlur(event);
    },
    onChange(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      const rawValue = event.currentTarget.value;
      const nextDigits = normalizeOTPValue(
        event.currentTarget.value,
        length,
        validationType,
        sanitizeValue,
      );
      const didSanitize = stripOTPWhitespace(rawValue).length > nextDigits.length;

      if (didSanitize) {
        reportValueInvalid(
          rawValue,
          createGenericEventDetails(REASONS.inputChange, event.nativeEvent),
        );
      }

      if (nextDigits === '') {
        if (rawValue === '') {
          setValue(
            removeOTPCharacter(value, index),
            createChangeEventDetails(REASONS.inputClear, event.nativeEvent),
          );
        }
        return;
      }

      const nextValue = replaceOTPValue(
        value,
        index,
        nextDigits,
        length,
        validationType,
        sanitizeValue,
      );

      const committedValue = setValue(
        nextValue,
        createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
      );

      if (committedValue != null) {
        const nextInput = Math.min(index + nextDigits.length, length - 1);
        if (nextInput !== index) {
          queueFocusInput(nextInput, committedValue);
        }
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        stopEvent(event);
        focusInput(Math.max(0, index - 1));
        return;
      }

      if (event.key === 'ArrowRight') {
        stopEvent(event);
        focusInput(Math.min(length - 1, index + 1));
        return;
      }

      if (event.key === 'Home') {
        stopEvent(event);
        focusInput(0);
        return;
      }

      if (event.key === 'End') {
        stopEvent(event);
        focusInput(Math.max(value.length - 1, 0));
        return;
      }

      if (event.key === 'Delete') {
        stopEvent(event);
        const committedValue = setValue(
          removeOTPCharacter(value, index),
          createChangeEventDetails(REASONS.keyboard, event.nativeEvent),
        );

        if (committedValue != null) {
          queueFocusInput(index, committedValue);
        }

        return;
      }

      const inputValue = event.currentTarget.value;
      const fullSelection =
        event.currentTarget.selectionStart === 0 &&
        event.currentTarget.selectionEnd === inputValue.length;

      if (event.key.length === 1 && fullSelection && slotValue === event.key) {
        stopEvent(event);
        focusInput(Math.min(length - 1, index + 1));
        return;
      }

      if (event.key === 'Backspace') {
        stopEvent(event);
        const deleteIndex = slotValue === '' ? Math.max(0, index - 1) : index;
        const targetIndex = Math.max(0, index - 1);
        const committedValue = setValue(
          removeOTPCharacter(value, deleteIndex),
          createChangeEventDetails(REASONS.keyboard, event.nativeEvent),
        );
        if (committedValue != null) {
          queueFocusInput(targetIndex, committedValue);
        }
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      event.preventDefault();
      const nextDigits = normalizeOTPValue(
        event.clipboardData.getData('text/plain'),
        length,
        validationType,
        sanitizeValue,
      );
      const rawValue = event.clipboardData.getData('text/plain');
      const didSanitize = stripOTPWhitespace(rawValue).length > nextDigits.length;

      if (didSanitize) {
        reportValueInvalid(
          rawValue,
          createGenericEventDetails(REASONS.inputPaste, event.nativeEvent),
        );
      }

      if (nextDigits === '') {
        return;
      }

      const committedValue = setValue(
        replaceOTPValue(value, index, nextDigits, length, validationType, sanitizeValue),
        createChangeEventDetails(REASONS.inputPaste, event.nativeEvent),
      );

      if (committedValue != null) {
        const nextInput = Math.min(index + nextDigits.length, length - 1);
        if (nextInput !== index) {
          queueFocusInput(nextInput, committedValue);
        }
      }
    },
  };

  const element = useRenderElement('input', componentProps, {
    ref: [forwardedRef, listItemRef],
    state: inputState,
    props: [inputProps, elementProps],
    stateAttributesMapping: inputStateAttributesMapping,
  });

  return element;
});

export interface OTPFieldInputState extends OTPFieldRootState {
  /**
   * Whether this input contains a character.
   */
  filled: boolean;
  /**
   * The input index.
   */
  index: number;
  /**
   * The character rendered in this slot.
   */
  value: string;
}

export interface OTPFieldInputProps extends BaseUIComponentProps<'input', OTPFieldInputState> {}

export namespace OTPFieldInput {
  export type State = OTPFieldInputState;
  export type Props = OTPFieldInputProps;
}
