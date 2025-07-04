'use client';
import * as React from 'react';
import { useFloatingTree } from '../../floating-ui-react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';
import { useCompositeItem } from '../../composite/item/useCompositeItem';

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

  const { setValue, popupElement, rootRef } = useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();
  const { props: compositeProps, ref: compositeRef } = useCompositeItem();

  return useRenderElement('a', componentProps, {
    ref: [forwardedRef, compositeRef],
    props: [
      compositeProps,
      {
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
      },
      elementProps,
    ],
  });
});

export namespace NavigationMenuLink {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
