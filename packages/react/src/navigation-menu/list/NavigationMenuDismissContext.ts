import * as React from 'react';
import type { ElementProps } from '../../floating-ui-react';
import { useContext } from '@base-ui/utils/useContext';

export const NavigationMenuDismissContext = React.createContext<ElementProps | undefined>(
  undefined,
);

export function useNavigationMenuDismissContext() {
  return useContext(NavigationMenuDismissContext);
}
