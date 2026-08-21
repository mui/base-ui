'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';
import { useRenderElement } from '../../internals/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';

/**
 * Renders its children only when no select items are registered.
 * The element remains mounted while the select popup is mounted and announces changes politely to
 * screen readers. Avoid hiding or removing the component itself with `display: none`, `hidden`,
 * `aria-hidden`, or conditional rendering. Prefer updating or conditionally rendering its children
 * instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectEmpty = React.forwardRef(function SelectEmpty(
  componentProps: SelectEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  const { store } = useSelectRootContext();
  const itemCount = useStore(store, selectors.itemCount);
  const emptyRef = useInitialLiveRegionTextMutation<HTMLDivElement>(itemCount === 0);

  const children = itemCount === 0 ? childrenProp : null;

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

export interface SelectEmptyState {}

export interface SelectEmptyProps extends BaseUIComponentProps<'div', SelectEmptyState> {}

export namespace SelectEmpty {
  export type State = SelectEmptyState;
  export type Props = SelectEmptyProps;
}
