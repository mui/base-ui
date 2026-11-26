'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';
import { useIsTreeEmpty } from '../utils/useIsTreeEmpty';

/**
 * Renders its children only when the tree has no visible rows, or when no item
 * matches the filter.
 * Announces changes politely to screen readers.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeEmpty = React.forwardRef(function TreeEmpty(
  componentProps: TreeEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  // Not empty while the root loads, so screen readers don't hear a spurious "no items".
  const children = useIsTreeEmpty() ? childrenProp : null;

  const emptyRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, emptyRef],
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
