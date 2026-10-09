'use client';
import * as React from 'react';
import type { ElementProps } from '../../utils/popups/floating-root/types';

export const NavigationMenuDismissContext = React.createContext<ElementProps | undefined>(
  undefined,
);

export function useNavigationMenuDismissContext() {
  return React.useContext(NavigationMenuDismissContext);
}
