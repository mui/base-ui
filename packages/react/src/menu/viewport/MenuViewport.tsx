'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupViewport } from '../../utils/popups/viewport/usePopupViewport';

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuViewport = React.forwardRef(function MenuViewport(
  componentProps: MenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store } = useMenuRootContext();
  const { side } = useMenuPositionerContext();

  return usePopupViewport({
    componentProps,
    forwardedRef,
    store,
    side,
  });
});

export interface MenuViewportState {
  /**
   * The activation direction of the transitioned content.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
  /**
   * Present if animations should be instant.
   */
  instant: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
}

export interface MenuViewportProps extends BaseUIComponentProps<'div', MenuViewportState> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
}

export namespace MenuViewport {
  export type Props = MenuViewportProps;
  export type State = MenuViewportState;
}
