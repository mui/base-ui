'use client';
import * as React from 'react';
import { NavigationMenuPopupCssVars } from './NavigationMenuPopupCssVars';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * A layered container that handles popup size transitions while allowing internal content transitions.
 * This solves the conflict between popup size transitions (which need fixed dimensions) and
 * content transitions like Collapsible (which need auto sizing).
 */
export const NavigationMenuSizeTransition = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function NavigationMenuSizeTransition(props, forwardedRef) {
  const { children, style, ...otherProps } = props;
  const { transitionStatus } = useNavigationMenuRootContext();

  // Outer container: handles popup size transitions with fixed dimensions
  const outerContainerStyle: React.CSSProperties = {
    // Use CSS variables for smooth size transitions
    width: `var(${NavigationMenuPopupCssVars.popupWidth})`,
    height: `var(${NavigationMenuPopupCssVars.popupHeight})`,
    // Enable size transitions
    transition: 'width 300ms ease, height 300ms ease',
    // Ensure content doesn't break out during transitions
    overflow: 'hidden',
    // Don't transition during initial render
    ...(transitionStatus === 'starting' && {
      transition: 'none',
    }),
    ...style,
  };

  // Inner container: allows content to be auto-sized for internal transitions
  const innerContainerStyle: React.CSSProperties = {
    width: 'auto',
    height: 'auto',
    // Allow content to expand naturally
    minWidth: '100%',
    minHeight: '100%',
    // Ensure proper positioning
    position: 'relative',
    // Enable any internal transitions (like Collapsible)
    // The content inside can use auto sizing without affecting the outer container
  };

  return (
    <div
      ref={forwardedRef}
      style={outerContainerStyle}
      data-size-transition-container=""
      {...otherProps}
    >
      <div style={innerContainerStyle} data-content-container="">
        {children}
      </div>
    </div>
  );
});
