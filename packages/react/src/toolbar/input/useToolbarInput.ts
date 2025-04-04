'use client';
import * as React from 'react';
import { useButton } from '../../use-button';
import { ARROW_LEFT, ARROW_RIGHT } from '../../composite/composite';

export function useToolbarInput(parameters: useToolbarInput.Parameters) {
  const { disabled, focusableWhenDisabled, ref: externalRef } = parameters;

  const { getButtonProps } = useButton({
    buttonRef: externalRef,
    disabled,
    focusableWhenDisabled,
    type: 'text',
    elementName: 'input',
  });

  const inputProps: React.ComponentProps<'input'> = React.useMemo(
    () => ({
      onClick(event) {
        if (disabled) {
          event.preventDefault();
        }
      },
      onKeyDown(event) {
        if (event.key !== ARROW_LEFT && event.key !== ARROW_RIGHT && disabled) {
          event.preventDefault();
        }
      },
      onPointerDown(event) {
        if (disabled) {
          event.preventDefault();
        }
      },
    }),
    [disabled],
  );

  return React.useMemo(
    () => ({
      inputProps,
      getButtonProps,
    }),
    [inputProps, getButtonProps],
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
}
