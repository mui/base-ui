'use client';
import * as React from 'react';

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

  const isFocusableComposite = composite && focusableWhenDisabled !== false;
  const isNonFocusableComposite = composite && focusableWhenDisabled === false;

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
      // A disabled non-native button is kept out of the tab order by not being focusable at all,
      // the way a disabled `<button>` is, rather than by `tabIndex: -1`. `-1` leaves the element
      // focusable by a click, and the only way to suppress that is canceling `pointerdown` — one
      // default action that also covers text selection and dragging, so the label of a disabled
      // control could not be selected or copied. `focusableWhenDisabled` still opts back in.
      if (isNativeButton || !disabled || focusableWhenDisabled) {
        additionalProps.tabIndex = tabIndexProp;
      }
    }

    if (
      (isNativeButton && (focusableWhenDisabled || isFocusableComposite)) ||
      (!isNativeButton && disabled)
    ) {
      additionalProps['aria-disabled'] = disabled;
    }

    if (isNativeButton && (!focusableWhenDisabled || isNonFocusableComposite)) {
      additionalProps.disabled = disabled;
    }

    return additionalProps;
  }, [
    composite,
    disabled,
    focusableWhenDisabled,
    isFocusableComposite,
    isNonFocusableComposite,
    isNativeButton,
    tabIndexProp,
  ]);

  return { props };
}

interface FocusableWhenDisabledProps {
  'aria-disabled'?: boolean | undefined;
  disabled?: boolean | undefined;
  onKeyDown: (event: React.KeyboardEvent) => void;
  tabIndex?: number | undefined;
}

export interface UseFocusableWhenDisabledParameters {
  /**
   * Whether the component should be focusable when disabled.
   * When `undefined`, composite items are focusable when disabled by default.
   */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * The disabled state of the component.
   */
  disabled: boolean;
  /**
   * Whether this is a composite item or not.
   * @default false
   */
  composite?: boolean | undefined;
  /**
   * @default 0
   */
  tabIndex?: number | undefined;
  /**
   * @default true
   */
  isNativeButton: boolean;
}

export interface UseFocusableWhenDisabledReturnValue {
  props: FocusableWhenDisabledProps;
}

export interface UseFocusableWhenDisabledState {}
