'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { ItemIndicator } from '../../utils/ItemIndicator';
import { useListboxItemContext } from '../item/ListboxItemContext';

/**
 * Indicates whether the listbox item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemIndicator = React.forwardRef(function ListboxItemIndicator(
  componentProps: ListboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { selected } = useListboxItemContext();

  const shouldRender = componentProps.keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  return <ItemIndicator {...componentProps} selected={selected} ref={forwardedRef} />;
});

export interface ListboxItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface ListboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  ListboxItemIndicatorState
> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   */
  keepMounted?: boolean | undefined;
}

export namespace ListboxItemIndicator {
  export type State = ListboxItemIndicatorState;
  export type Props = ListboxItemIndicatorProps;
}
