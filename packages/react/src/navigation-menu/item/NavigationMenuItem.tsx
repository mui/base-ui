'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { NavigationMenuItemContext } from './NavigationMenuItemContext';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * An individual navigation menu item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuItem = React.forwardRef(function NavigationMenuItem(
  componentProps: NavigationMenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value: valueProp, ...elementProps } = componentProps;

  const fallbackValue = useBaseUiId();
  const value = valueProp ?? fallbackValue;

  const element = useRenderElement('li', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });

  return (
    <NavigationMenuItemContext.Provider value={value}>{element}</NavigationMenuItemContext.Provider>
  );
});

export interface NavigationMenuItemState {}

export interface NavigationMenuItemProps
  extends BaseUIComponentProps<'li', NavigationMenuItemState> {
  /**
   * A unique value that identifies this navigation menu item.
   * If no value is provided, a unique ID will be generated automatically.
   * Use when controlling the navigation menu programmatically.
   */
  value?: any;
}

export namespace NavigationMenuItem {
  export type State = NavigationMenuItemState;
  export type Props = NavigationMenuItemProps;
}
