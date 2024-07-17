'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';

/**
 *
 * API:
 *
 * - [useMenuPopup API](https://mui.com/base-ui/api/use-menu-popup/)
 */
export function useMenuPopup(parameters: useMenuPopup.Parameters): useMenuPopup.ReturnValue {
  const { menuEvents, setOpen } = parameters;

  React.useEffect(() => {
    function handleClose(event: Event | undefined) {
      setOpen(false, event);
    }

    menuEvents.on('close', handleClose);

    return () => {
      menuEvents.off('close', handleClose);
    };
  }, [menuEvents, setOpen]);
}

namespace useMenuPopup {
  export interface Parameters {
    menuEvents: FloatingEvents;
    setOpen: (open: boolean, event: Event | undefined) => void;
  }

  export type ReturnValue = void;
}
