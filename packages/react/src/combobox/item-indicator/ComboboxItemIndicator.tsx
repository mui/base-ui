'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useComboboxItemContext } from '../item/ComboboxItemContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { ItemIndicator } from '../../utils/ItemIndicator';

/**
 * Indicates whether the item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxItemIndicator = React.forwardRef(function ComboboxItemIndicator(
  componentProps: ComboboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { selected } = useComboboxItemContext();

  const shouldRender = componentProps.keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  return <ItemIndicator {...componentProps} selected={selected} ref={forwardedRef} />;
});

export interface ComboboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  ComboboxItemIndicatorState
> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface ComboboxItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace ComboboxItemIndicator {
  export type Props = ComboboxItemIndicatorProps;
  export type State = ComboboxItemIndicatorState;
}
