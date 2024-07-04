'use client';
import * as React from 'react';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

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

  const getRootProps = (externalProps?: GenericHTMLProps) => {
    return mergeReactProps(externalProps, {
      role: 'menu',
    });
  };

  return {
    getRootProps,
  };
}
