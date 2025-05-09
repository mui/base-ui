'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuViewport = React.forwardRef(function NavigationMenuViewport(
  componentProps: NavigationMenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { setViewportElement } = useNavigationMenuRootContext();

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setViewportElement],
    props: elementProps,
  });

  return renderElement();
});

export namespace NavigationMenuViewport {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
