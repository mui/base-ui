'use client';
import * as React from 'react';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Displays an element pointing toward the navigation menu's current anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuArrow = React.forwardRef(function NavigationMenuArrow(
  componentProps: NavigationMenuArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { open } = useNavigationMenuRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } =
    useNavigationMenuPositionerContext();

  const state: NavigationMenuArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{ style: arrowStyles, 'aria-hidden': true }, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return renderElement();
});

export namespace NavigationMenuArrow {
  export interface State {
    /**
     * Whether the popup is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
