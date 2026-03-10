'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useInitialLiveRegionTextMutation } from '../utils/useInitialLiveRegionTextMutation';

/**
 * Renders its children only when the list is empty.
 * Requires the `items` prop on the root component.
 * Announces changes politely to screen readers.
 * To announce updates reliably, keep this element mounted instead of conditionally
 * hiding or removing it with `display: none`, `hidden`, or `aria-hidden`; prefer
 * CSS such as `:empty` to conditionally apply layout styles when it has no content.
 * Renders a `<div>` element.
 */
export const ComboboxEmpty = React.forwardRef(function ComboboxEmpty(
  componentProps: ComboboxEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  const { filteredItems } = useComboboxDerivedItemsContext();
  const store = useComboboxRootContext();
  const emptyRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  const children = filteredItems.length === 0 ? childrenProp : null;

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.state.emptyRef, emptyRef],
    props: [
      {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
        children,
      },
      elementProps,
    ],
  });
});

export interface ComboboxEmptyState {}

export interface ComboboxEmptyProps extends BaseUIComponentProps<'div', ComboboxEmptyState> {}

export namespace ComboboxEmpty {
  export type State = ComboboxEmptyState;
  export type Props = ComboboxEmptyProps;
}
