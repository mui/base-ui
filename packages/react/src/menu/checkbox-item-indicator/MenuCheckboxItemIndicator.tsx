'use client';
import * as React from 'react';
import { useMenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItemContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { itemMapping } from '../utils/stateAttributesMapping';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { ARIA_HIDDEN_PROPS, useSelectionIndicator } from '../../utils/ItemIndicator';

/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItemIndicator = React.forwardRef(function MenuCheckboxItemIndicator(
  componentProps: MenuCheckboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const item = useMenuCheckboxItemContext();

  return useSelectionIndicator(
    componentProps,
    forwardedRef,
    item.checked,
    item,
    itemMapping,
    ARIA_HIDDEN_PROPS,
  );
});

export interface MenuCheckboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  MenuCheckboxItemIndicatorState
> {
  /**
   * Whether to keep the HTML element in the DOM when the checkbox item is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface MenuCheckboxItemIndicatorState {
  /**
   * Whether the checkbox item is currently ticked.
   */
  checked: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace MenuCheckboxItemIndicator {
  export type Props = MenuCheckboxItemIndicatorProps;
  export type State = MenuCheckboxItemIndicatorState;
}
