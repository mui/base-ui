'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useSelectItemContext } from '../item/SelectItemContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { ItemIndicator } from '../../utils/ItemIndicator';

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItemIndicator = React.forwardRef(function SelectItemIndicator(
  componentProps: SelectItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { selected } = useSelectItemContext();

  const shouldRender = componentProps.keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  return <ItemIndicator {...componentProps} selected={selected} ref={forwardedRef} />;
});

export interface SelectItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface SelectItemIndicatorProps extends BaseUIComponentProps<
  'span',
  SelectItemIndicatorState
> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   */
  keepMounted?: boolean | undefined;
}

export namespace SelectItemIndicator {
  export type State = SelectItemIndicatorState;
  export type Props = SelectItemIndicatorProps;
}
