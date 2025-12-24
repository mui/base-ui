'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';

/**
 * Renders its children only when the list is empty.
 * Announces changes politely to screen readers.
 * Renders a `<div>` element.
 */
export const ComboboxEmpty = React.forwardRef(function ComboboxEmpty(
  componentProps: ComboboxEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children: childrenProp, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const visibleItemCount = useStore(store, selectors.visibleItemCount);

  const children = visibleItemCount === 0 ? childrenProp : null;

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.state.emptyRef],
    props: [
      {
        children,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export interface ComboboxEmptyState {}

export interface ComboboxEmptyProps extends BaseUIComponentProps<'div', ComboboxEmpty.State> {}

export namespace ComboboxEmpty {
  export type State = ComboboxEmptyState;
  export type Props = ComboboxEmptyProps;
}
