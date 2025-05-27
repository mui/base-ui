'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { HTMLProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { ARROW_LEFT, ARROW_RIGHT, stopEvent } from '../../composite/composite';

export function useToolbarInput(
  parameters: useToolbarInput.Parameters,
): useToolbarInput.ReturnValue {
  const { disabled, focusableWhenDisabled, ref: externalRef } = parameters;

  const { getButtonProps } = useButton({
    buttonRef: externalRef,
    disabled,
    focusableWhenDisabled,
    input: true,
  });

  const getInputProps = React.useCallback(
    (externalProps: HTMLProps = {}) =>
      mergeProps<'input'>(
        {
          onClick(event) {
            if (disabled) {
              event.preventDefault();
            }
          },
          onKeyDown(event) {
            if (event.key !== ARROW_LEFT && event.key !== ARROW_RIGHT && disabled) {
              stopEvent(event);
            }
          },
          onPointerDown(event) {
            if (disabled) {
              event.preventDefault();
            }
          },
        },
        externalProps,
        getButtonProps,
      ),
    [disabled, getButtonProps],
  );

  return React.useMemo(
    () => ({
      getInputProps,
    }),
    [getInputProps],
  );
}

export namespace useToolbarInput {
  export interface Parameters {
    /**
     * When `true` the item is disabled.
     */
    disabled: boolean;
    /**
     * When `true` the item remains focuseable when disabled.
     */
    focusableWhenDisabled: boolean;
    /**
     * The element ref.
     */
    ref?: React.Ref<Element>;
  }

  export interface ReturnValue {
    getInputProps: (externalProps?: HTMLProps) => HTMLProps;
  }
}
