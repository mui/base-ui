'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
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

  return (
    <CompositeRoot
      render={render}
      className={className}
      state={state}
      refs={[forwardedRef]}
      props={[elementProps]}
      loop={false}
      orientation={orientation}
      stopEventPropagation
    />
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
