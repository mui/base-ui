'use client';
import * as React from 'react';

export interface UseFocusableWhenDisabledParameters {
  focusableWhenDisabled: boolean | undefined;
  disabled: boolean;
  /**
   * Whether this is a composite item or not
   * @default false
   */
  composite?: boolean;
  /**
   * @default 0
   */
  tabIndex?: number;
  /**
   * @default true
   */
  isNativeButton: boolean;
}

export interface FocusableWhenDisabledProps {
  'aria-disabled'?: boolean;
  disabled?: boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
  tabIndex: number;
}

export interface UseFocusableWhenDisabledReturnValue {
  props: FocusableWhenDisabledProps;
}

export function useFocusableWhenDisabled(
  parameters: UseFocusableWhenDisabledParameters,
): UseFocusableWhenDisabledReturnValue {
  const {
    focusableWhenDisabled,
    disabled,
    composite = false,
    tabIndex: tabIndexProp = 0,
    isNativeButton,
  } = parameters;

  // we can't explicitly assign `undefined` to any of these props because it
  // would otherwise prevent subsequently merged props from setting them
  const props = React.useMemo(() => {
    const additionalProps = {
      // allow Tabbing away from focusableWhenDisabled elements
      onKeyDown(event: React.KeyboardEvent) {
        if (disabled && focusableWhenDisabled && event.key !== 'Tab') {
          event.preventDefault();
        }
      },
    } as FocusableWhenDisabledProps;

    if (!composite) {
      additionalProps.tabIndex = tabIndexProp;

      if (!isNativeButton && disabled) {
        additionalProps.tabIndex = focusableWhenDisabled ? tabIndexProp : -1;
      }
    }

    if (
      (isNativeButton &&
        (focusableWhenDisabled || (composite && focusableWhenDisabled !== false))) ||
      (!isNativeButton && disabled)
    ) {
      additionalProps['aria-disabled'] = disabled;
    }

    if (isNativeButton && !composite && !focusableWhenDisabled) {
      additionalProps.disabled = disabled;
    }

    return additionalProps;
  }, [disabled, focusableWhenDisabled, composite, isNativeButton, tabIndexProp]);

  return { props };
}
