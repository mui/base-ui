'use client';
import * as React from 'react';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';

/**
 *
 * API:
 *
 * - [useMenuPopup API](https://mui.com/base-ui/api/use-menu-popup/)
 */
export function useMenuPopup(parameters: UseMenuPopupParameters): UseMenuPopupReturnValue {
  const { menuEvents, setOpen } = parameters;

  React.useEffect(() => {
    menuEvents.on('close', (event: Event | undefined) => {
      setOpen(false, event);
    });
  }, [menuEvents, setOpen]);
}
