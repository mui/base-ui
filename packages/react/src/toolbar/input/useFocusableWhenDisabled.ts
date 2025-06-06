'use client';
import * as React from 'react';
import { BaseUIEvent, HTMLProps } from '../../utils/types';

export interface UseFocusableWhenDisabledParameters {
  focusableWhenDisabled: boolean;
  disabled: boolean;
  /**
   * Whether this is a composite item or not
   * @default false
   */
  composite?: boolean;
}

export function useFocusableWhenDisabled(parameters: UseFocusableWhenDisabledParameters) {
  const { focusableWhenDisabled, disabled, composite = false } = parameters;

  const props: HTMLProps = React.useMemo(() => {
    return {
      'aria-disabled': focusableWhenDisabled || composite ? disabled : undefined,
      disabled: !focusableWhenDisabled && !composite ? disabled : undefined,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        if (
          // allows Tabbing away from focusableWhenDisabled elements
          disabled &&
          focusableWhenDisabled &&
          event.key !== 'Tab'
        ) {
          event.preventDefault();
        }
      },
    };
  }, [disabled, focusableWhenDisabled, composite]);

  return { props };
}
