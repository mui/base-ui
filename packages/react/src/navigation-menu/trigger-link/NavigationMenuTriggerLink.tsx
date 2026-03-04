'use client';
import * as React from 'react';
import { useFloatingTree } from '../../floating-ui-react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { handleNavigationMenuBlur } from '../utils/handleNavigationMenuBlur';
import { NAVIGATION_MENU_TRIGGER_LINK_IDENTIFIER } from '../utils/constants';

/**
 * A link that can be placed inside `TriggerGroup` for top-level navigation.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuTriggerLink = React.forwardRef(function NavigationMenuTriggerLink(
  componentProps: NavigationMenuTriggerLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, active = false, ...elementProps } = componentProps;

  const { value: itemValue } = useNavigationMenuItemContext();
  const { open, value, setValue, popupElement, positionerElement, rootRef } =
    useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  const isActiveItem = open && value === itemValue;

  const state: NavigationMenuTriggerLink.State = {
    active,
    open: isActiveItem,
  };

  const defaultProps: HTMLProps = {
    [NAVIGATION_MENU_TRIGGER_LINK_IDENTIFIER as string]: '',
    'aria-current': active ? 'page' : undefined,
    onBlur(event) {
      handleNavigationMenuBlur({
        event,
        popupElement,
        positionerElement,
        rootRef,
        tree,
        nodeId,
        setValue,
      });
    },
  };

  const element = useRenderElement('a', componentProps, {
    ref: forwardedRef,
    state,
    props: [defaultProps, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
});

export interface NavigationMenuTriggerLinkState {
  /**
   * Whether the trigger link points to the currently active page.
   */
  active: boolean;
  /**
   * Whether the popup is open and the item is active.
   */
  open: boolean;
}

export interface NavigationMenuTriggerLinkProps extends BaseUIComponentProps<
  'a',
  NavigationMenuTriggerLink.State
> {
  /**
   * Whether the trigger link points to the currently active page.
   * @default false
   */
  active?: boolean | undefined;
}

export namespace NavigationMenuTriggerLink {
  export type State = NavigationMenuTriggerLinkState;
  export type Props = NavigationMenuTriggerLinkProps;
}
