import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const PopoverPortalContext = React.createContext<boolean | undefined>(undefined);

export function usePopoverPortalContext() {
  const value = useContext(PopoverPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Popover.Portal> is missing.');
  }
  return value;
}
