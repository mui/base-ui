'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';

/**
 * @internal
 */
export const FilterDropdownClear = React.forwardRef(function FilterDropdownClear(
  componentProps: FilterDropdownClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const context = useFilterDropdownRootContext();
  const value = useFilterDropdownValueContext();
  const disabled = context.disabled || disabledProp;
  const { buttonRef, getButtonProps } = useButton({ disabled, native: nativeButton });
  const visible = value !== '';

  // `visible` is deliberately absent from the state: the component renders nothing when it is
  // false, so a `data-visible` attribute would be present on every rendered instance.
  const state: FilterDropdownClearState = {
    disabled,
  };

  return useRenderElement('button', componentProps, {
    enabled: visible,
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        tabIndex: -1,
        onMouseDown(event) {
          // Avoid stealing focus from the input on pointer interaction.
          event.preventDefault();
        },
        onClick(event) {
          const eventDetails = createChangeEventDetails(REASONS.clearPress, event.nativeEvent);
          context.onValueChange('', eventDetails);
          if (!eventDetails.isCanceled) {
            // Indexes are positional, so a kept highlight lands on whatever fills the slot.
            context.setActiveIndex(null);
          }
          context.focusOwnerRef.current?.focus({ preventScroll: true });
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export interface FilterDropdownClearState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface FilterDropdownClearProps
  extends NativeButtonProps, BaseUIComponentProps<'button', FilterDropdownClearState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace FilterDropdownClear {
  export type Props = FilterDropdownClearProps;
  export type State = FilterDropdownClearState;
}
