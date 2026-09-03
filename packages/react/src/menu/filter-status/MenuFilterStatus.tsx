'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';

/**
 * A status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * Renders nothing while it has no children, so screen readers don't count an
 * empty node among the popup's contents.
 * Renders a `<div>` element.
 *
 * Requires `Menu.FilterRoot` or `Menu.FilterSubmenuRoot`.
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuFilterStatus = React.forwardRef(function MenuFilterStatus(
  componentProps: MenuFilterStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, ...elementProps } = componentProps;

  const hasChildren = children != null && children !== false && children !== '';
  const statusRef = useInitialLiveRegionTextMutation<HTMLDivElement>(hasChildren);

  return useRenderElement('div', componentProps, {
    enabled: hasChildren,
    ref: [forwardedRef, statusRef],
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

export interface MenuFilterStatusState {}

export interface MenuFilterStatusProps extends BaseUIComponentProps<'div', MenuFilterStatusState> {}

export namespace MenuFilterStatus {
  export type State = MenuFilterStatusState;
  export type Props = MenuFilterStatusProps;
}
