'use client';
import * as React from 'react';
import type { FloatingContext } from '@floating-ui/react';
import type { Side } from '../../utils/useAnchorPositioning';

export interface MenuPositionerContext {
  /**
   * The side of the anchor element the popup is positioned relative to.
   */
  side: Side;
  /**
   * How to align the popup relative to the specified side.
   */
  align: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
  floatingContext: FloatingContext;
}

export const MenuPositionerContext = React.createContext<MenuPositionerContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  MenuPositionerContext.displayName = 'MenuPositionerContext';
}

export function useMenuPositionerContext(optional: false): MenuPositionerContext;
export function useMenuPositionerContext(optional?: true): MenuPositionerContext | undefined;
export function useMenuPositionerContext(optional = true) {
  const context = React.useContext(MenuPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
    );
  }
  return context;
}
