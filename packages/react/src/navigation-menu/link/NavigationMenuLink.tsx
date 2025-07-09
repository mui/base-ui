'use client';
import * as React from 'react';
import { useFloatingTree } from '../../floating-ui-react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';
import { CompositeItem } from '../../composite/item/CompositeItem';

/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuLink = React.forwardRef(function NavigationMenuLink(
  componentProps: NavigationMenuLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, closeOnClick = true, onClick, ...elementProps } = componentProps;

  const { setValue, popupElement, rootRef } = useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  const defaultProps: HTMLProps = {
    tabIndex: undefined,
    onBlur(event) {
      if (
        isOutsideMenuEvent(
          {
            currentTarget: event.currentTarget,
            relatedTarget: event.relatedTarget as HTMLElement | null,
          },
          { popupElement, rootRef, tree, nodeId },
        )
      ) {
        setValue(null, event.nativeEvent, undefined);
      }
    },
    onClick(event) {
      if (!closeOnClick) {
        return;
      }
      setValue(null, event.nativeEvent, undefined);
    },
  };

  return (
    <CompositeItem
      tag="a"
      render={render}
      className={className}
      refs={[forwardedRef]}
      props={[defaultProps, elementProps]}
    />
  );
});

export namespace NavigationMenuLink {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'a', State> {
    /**
     * Whether the navigation menu popup should close when the link is clicked.
     * @default true
     */
    closeOnClick?: boolean;
  }
}
