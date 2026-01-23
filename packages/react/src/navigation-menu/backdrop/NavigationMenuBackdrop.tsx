'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';

const stateAttributesMapping: StateAttributesMapping<NavigationMenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A backdrop for the navigation menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuBackdrop = React.forwardRef(function NavigationMenuBackdrop(
  componentProps: NavigationMenuBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { open, mounted, transitionStatus } = useNavigationMenuRootContext();

  const state: NavigationMenuBackdrop.State = {
    open,
    transitionStatus,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export interface NavigationMenuBackdropState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * The transition status of the popup.
   */
  transitionStatus: TransitionStatus;
}

export interface NavigationMenuBackdropProps extends BaseUIComponentProps<
  'div',
  NavigationMenuBackdrop.State
> {}

export namespace NavigationMenuBackdrop {
  export type State = NavigationMenuBackdropState;
  export type Props = NavigationMenuBackdropProps;
}
