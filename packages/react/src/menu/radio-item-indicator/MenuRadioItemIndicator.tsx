'use client';
import * as React from 'react';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { itemMapping } from '../utils/stateAttributesMapping';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { ARIA_HIDDEN_PROPS, useSelectionIndicator } from '../../utils/ItemIndicator';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioItemIndicator = React.forwardRef(function MenuRadioItemIndicator(
  componentProps: MenuRadioItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const item = useMenuRadioItemContext();

  return useSelectionIndicator(
    componentProps,
    forwardedRef,
    item.checked,
    item,
    itemMapping,
    ARIA_HIDDEN_PROPS,
  );
});

export interface MenuRadioItemIndicatorProps extends BaseUIComponentProps<
  'span',
  MenuRadioItemIndicatorState
> {
  /**
   * Whether to keep the HTML element in the DOM when the radio item is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface MenuRadioItemIndicatorState {
  /**
   * Whether the radio item is currently selected.
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

export namespace MenuRadioItemIndicator {
  export type Props = MenuRadioItemIndicatorProps;
  export type State = MenuRadioItemIndicatorState;
}
