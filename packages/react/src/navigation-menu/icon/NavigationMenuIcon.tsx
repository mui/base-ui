'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';

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

  const itemValue = useNavigationMenuItemContext();
  const { open, value } = useNavigationMenuRootContext();

  const isActiveItem = open && value === itemValue;

  const state: NavigationMenuIcon.State = React.useMemo(
    () => ({
      open: isActiveItem,
    }),
    [isActiveItem],
  );

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ 'aria-hidden': true, children: '▼' }, elementProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return element;
});

export namespace NavigationMenuIcon {
  export interface State {
    /**
     * Whether the navigation menu is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
