'use client';
import * as React from 'react';
import { stopEvent } from '../../floating-ui-react/utils';
import {
  IndexGuessBehavior,
  useCompositeListItem,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useOTPFieldRootContext, getOTPFieldInputState } from '../root/OTPFieldRootContext';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import { inputStateAttributesMapping } from '../utils/stateAttributesMapping';
import { normalizeOTPValue, removeOTPCharacter, replaceOTPValue } from '../utils/otp';

/**
 * An individual OTP digit input.
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
    ariaLabelledBy,
    autoComplete,
    disabled,
    focusInput,
    queueFocusInput,
    getInputId,
    handleInputBlur,
    handleInputFocus,
    invalid,
    length,
    readOnly,
    required,
    setValue,
    state,
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
    type: 'text',
    inputMode: 'numeric',
    autoComplete: index === 0 ? autoComplete : 'off',
    autoCorrect: 'off',
    spellCheck: 'false',
    enterKeyHint: index === length - 1 ? 'done' : 'next',
    maxLength: index === 0 ? length : 1,
    tabIndex: activeIndex === index ? 0 : -1,
    disabled,
    readOnly,
    required,
    'aria-labelledby':
      componentProps['aria-label'] == null
        ? (componentProps['aria-labelledby'] ?? ariaLabelledBy)
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
      const nextDigits = normalizeOTPValue(event.currentTarget.value, length);

      if (nextDigits === '') {
        if (rawValue === '') {
          setValue(
            removeOTPCharacter(value, index),
            createChangeEventDetails(REASONS.inputClear, event.nativeEvent),
          );
        }
        return;
      }

      const nextValue = replaceOTPValue(value, index, nextDigits, length);

      setValue(
        nextValue,
        createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
      );

      const nextInput = Math.min(index + nextDigits.length, length - 1);
      queueFocusInput(nextInput);
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
        setValue(
          removeOTPCharacter(value, index),
          createChangeEventDetails(REASONS.keyboard, event.nativeEvent),
        );
        return;
      }

      const inputValue = event.currentTarget.value;
      const fullSelection =
        event.currentTarget.selectionStart === 0 &&
        event.currentTarget.selectionEnd === inputValue.length;

      if (event.key >= '0' && event.key <= '9' && fullSelection && slotValue === event.key) {
        stopEvent(event);
        focusInput(Math.min(length - 1, index + 1));
        return;
      }

      if (event.key === 'Backspace') {
        stopEvent(event);
        const deleteIndex = slotValue === '' ? Math.max(0, index - 1) : index;
        const targetIndex = Math.max(0, index - 1);
        setValue(
          removeOTPCharacter(value, deleteIndex),
          createChangeEventDetails(REASONS.keyboard, event.nativeEvent),
        );
        queueFocusInput(targetIndex);
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || disabled || readOnly) {
        return;
      }

      event.preventDefault();
      const nextDigits = normalizeOTPValue(event.clipboardData.getData('text/plain'), length);

      if (nextDigits === '') {
        return;
      }

      setValue(
        replaceOTPValue(value, index, nextDigits, length),
        createChangeEventDetails(REASONS.inputPaste, event.nativeEvent),
      );

      const nextInput = Math.min(index + nextDigits.length, length - 1);
      queueFocusInput(nextInput);
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
   * Whether this input contains a digit.
   */
  filled: boolean;
  /**
   * The input index.
   */
  index: number;
  /**
   * The digit rendered in this slot.
   */
  value: string;
}

export interface OTPFieldInputProps extends BaseUIComponentProps<'input', OTPFieldInputState> {}

export namespace OTPFieldInput {
  export type State = OTPFieldInputState;
  export type Props = OTPFieldInputProps;
}
