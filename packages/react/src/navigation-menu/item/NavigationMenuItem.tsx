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
  const {
    className,
    render,
    value: valueProp,
    openOnHover = true,
    ...elementProps
  } = componentProps;

  const fallbackValue = useBaseUiId();
  const value = valueProp ?? fallbackValue;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: elementProps,
  });

  const contextValue: NavigationMenuItemContext = React.useMemo(
    () => ({
      value,
      openOnHover,
    }),
    [value, openOnHover],
  );

  return (
    <NavigationMenuItemContext.Provider value={contextValue}>
      {element}
    </NavigationMenuItemContext.Provider>
  );
});

export namespace NavigationMenuItem {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * A unique value that identifies this navigation menu item.
     * If no value is provided, a unique ID will be generated automatically.
     * Use when controlling the navigation menu programmatically.
     */
    value?: any;
    /**
     * Whether the navigation menu popup will open when the trigger is hovered
     * in addition to clicking the trigger.
     * @default false
     */
    openOnHover?: boolean;
  }
}
