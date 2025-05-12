'use client';
import * as React from 'react';
import type { FloatingEvents } from '@floating-ui/react';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';

export function useMenuPopup(parameters: useMenuPopup.Parameters): useMenuPopup.ReturnValue {
  const { menuEvents, setOpen } = parameters;

  React.useEffect(() => {
    function handleClose(event: {
      domEvent: Event | undefined;
      reason: OpenChangeReason | undefined;
    }) {
      setOpen(false, event.domEvent, event.reason);
    }

    menuEvents.on('close', handleClose);

    return () => {
      menuEvents.off('close', handleClose);
    };
  }, [menuEvents, setOpen]);
}

export namespace useMenuPopup {
  export interface Parameters {
    /**
     * The FloatingEvents instance of the menu's root.
     */
    menuEvents: FloatingEvents;
    /**
     * Callback to set the open state of the menu.
     */
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
  }

  export type ReturnValue = void;
}
