'use client';
import * as React from 'react';
import { useFloatingTree } from '@floating-ui/react';
import { contains } from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeItem } from '../../composite/item/CompositeItem';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';

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
  const { className, render, ...elementProps } = componentProps;

  const { setOpen, popupElement, rootRef } = useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  const renderElement = useRenderElement('a', componentProps, {
    ref: forwardedRef,
    props: [
      {
        onMouseEnter(event) {
          if (!contains(popupElement, event.currentTarget)) {
            setOpen(false, event.nativeEvent, undefined);
          }
        },
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
            setOpen(false, event.nativeEvent, undefined);
          }
        },
      },
      elementProps,
    ],
  });

  return <CompositeItem render={renderElement()} tabIndex={undefined} />;
});

export namespace NavigationMenuLink {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
