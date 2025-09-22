'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { useBodyClientHeight } from '../../utils/useBodyClientHeight';
import { NavigationMenuBackdropCssVars } from './NavigationMenuBackdropCssVars';

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

  const backdropRef = React.useRef<HTMLDivElement | null>(null);

  const bodyClientHeight = useBodyClientHeight(backdropRef, open);

  const state: NavigationMenuBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [backdropRef, forwardedRef],
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          [NavigationMenuBackdropCssVars.bodyClientHeight as string]: `${bodyClientHeight}px`,
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export namespace NavigationMenuBackdrop {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
    /**
     * The transition status of the popup.
     */
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
