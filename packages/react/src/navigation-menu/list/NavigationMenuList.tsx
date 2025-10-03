'use client';
import * as React from 'react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
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

  const defaultProps: HTMLProps = {
    // `stopEventPropagation` won't stop the propagation if the end of the list is reached,
    // but we want to block it in this case.
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      const shouldStop =
        (orientation === 'horizontal' &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
        (orientation === 'vertical' && (event.key === 'ArrowUp' || event.key === 'ArrowDown'));

      if (shouldStop) {
        event.stopPropagation();
      }
    },
  };

  return (
    <CompositeRoot
      render={render}
      className={className}
      state={state}
      refs={[forwardedRef]}
      props={[defaultProps, elementProps]}
      loop={false}
      orientation={orientation}
      tag="ul"
    />
  );
});

export interface NavigationMenuListState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
}

export interface NavigationMenuListProps
  extends BaseUIComponentProps<'ul', NavigationMenuList.State> {}

export namespace NavigationMenuList {
  export type State = NavigationMenuListState;
  export type Props = NavigationMenuListProps;
}
