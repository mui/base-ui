'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An icon that indicates that the trigger button opens a menu.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuIcon = React.forwardRef(function NavigationMenuIcon(
  componentProps: NavigationMenuIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const renderElement = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [{ 'aria-hidden': true, children: '▼' }, elementProps],
  });

  return renderElement();
});

export namespace NavigationMenuIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
