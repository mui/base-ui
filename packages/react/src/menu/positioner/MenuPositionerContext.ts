'use client';
import * as React from 'react';
import type { Side } from '../../utils/useAnchorPositioning';

export interface MenuPositionerContext {
  /**
   * The side of the anchor element the popup is positioned relative to.
   */
  side: Side;
  /**
   * The align of the anchor element the popup is positioned relative to.
   */
  align: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const MenuPositionerContext = React.createContext<MenuPositionerContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  MenuPositionerContext.displayName = 'MenuPositionerContext';
}

export function useMenuPositionerContext() {
  const context = React.useContext(MenuPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
    );
  }
  return context;
}
