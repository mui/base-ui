'use client';
import * as React from 'react';
import { BaseUIEvent, HTMLProps } from '../../utils/types';
import { useCompositeRootContext } from '../../composite/root/CompositeRootContext';

export interface UseFocusableWhenDisabledParameters {
  focusableWhenDisabled: boolean;
  disabled: boolean;
}

export function useFocusableWhenDisabled(parameters: UseFocusableWhenDisabledParameters) {
  const { focusableWhenDisabled, disabled } = parameters;

  const isCompositeItem = useCompositeRootContext(true) !== undefined;

  const props: HTMLProps = React.useMemo(() => {
    return {
      'aria-disabled': focusableWhenDisabled || isCompositeItem ? disabled : undefined,
      disabled: !focusableWhenDisabled && !isCompositeItem ? disabled : undefined,
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
  }, [disabled, focusableWhenDisabled, isCompositeItem]);

  return { props };
}
