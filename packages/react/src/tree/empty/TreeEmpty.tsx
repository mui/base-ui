'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';

/**
 * Renders its children only when the tree has no items.
 * Announces changes politely to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeEmpty = React.forwardRef(function TreeEmpty(
  componentProps: TreeEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children: childrenProp, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const items = useStore(store, (state) => state.items);

  const children = items.length === 0 ? childrenProp : null;

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
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

export interface TreeEmptyState {}

export interface TreeEmptyProps extends BaseUIComponentProps<'div', TreeEmpty.State> {}

export namespace TreeEmpty {
  export type State = TreeEmptyState;
  export type Props = TreeEmptyProps;
}
