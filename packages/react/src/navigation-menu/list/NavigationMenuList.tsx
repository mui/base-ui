'use client';
import * as React from 'react';
import { useDismiss } from '../../floating-ui-react';
import { getTarget } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { EMPTY_OBJECT } from '../../utils/constants';
import { NAVIGATION_MENU_TRIGGER_IDENTIFIER } from '../utils/constants';
import { NavigationMenuDismissContext } from './NavigationMenuDismissContext';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';

/**
 * Contains a list of navigation menu items.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuList = React.forwardRef(function NavigationMenuList(
  componentProps: NavigationMenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { orientation, open, floatingRootContext, positionerElement, value } =
    useNavigationMenuRootContext();

  const fallbackContext = React.useMemo(() => getEmptyContext(), []);
  const context = floatingRootContext || fallbackContext;
  const interactionsEnabled = positionerElement ? true : !value;

  const dismiss = useDismiss(context, {
    enabled: interactionsEnabled,
    outsidePressEvent: 'intentional',
    outsidePress(event) {
      const target = getTarget(event) as HTMLElement | null;
      const closestNavigationMenuTrigger = target?.closest(
        `[${NAVIGATION_MENU_TRIGGER_IDENTIFIER}]`,
      );
      return closestNavigationMenuTrigger === null;
    },
  });

  const dismissProps = floatingRootContext ? dismiss : undefined;

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
    <NavigationMenuDismissContext.Provider value={dismissProps}>
      <CompositeRoot
        render={render}
        className={className}
        state={state}
        refs={[forwardedRef]}
        props={[dismissProps?.floating || EMPTY_OBJECT, defaultProps, elementProps]}
        loop={false}
        orientation={orientation}
        tag="ul"
      />
    </NavigationMenuDismissContext.Provider>
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
