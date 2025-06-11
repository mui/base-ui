'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * Contains a list of navigation menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuList = React.forwardRef(function NavigationMenuList(
  componentProps: NavigationMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { orientation, open } = useNavigationMenuRootContext();

  const state: NavigationMenuList.State = React.useMemo(
    () => ({
      open,
    }),
    [open],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
  });

  return (
    <CompositeRoot render={element} loop={false} orientation={orientation} stopEventPropagation />
  );
});

export namespace NavigationMenuList {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
