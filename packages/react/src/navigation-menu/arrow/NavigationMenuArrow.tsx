'use client';
import * as React from 'react';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import type { Align, Side } from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupArrow } from '../../utils/popups/popupParts';
import { getDisabledMountTransitionStyles } from '../../internals/getDisabledMountTransitionStyles';

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
  const { open, transitionStatus } = useNavigationMenuRootContext();

  return usePopupArrow(componentProps, forwardedRef, open, useNavigationMenuPositionerContext(), {
    extraProps: getDisabledMountTransitionStyles(transitionStatus),
  });
});

export interface NavigationMenuArrowState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}

export interface NavigationMenuArrowProps extends BaseUIComponentProps<
  'div',
  NavigationMenuArrowState
> {}

export namespace NavigationMenuArrow {
  export type State = NavigationMenuArrowState;
  export type Props = NavigationMenuArrowProps;
}
