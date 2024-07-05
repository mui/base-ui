import { FloatingEvents } from '@floating-ui/react';

export interface UseMenuPopupParameters {
  menuEvents: FloatingEvents;
  setOpen: (open: boolean, event: Event | undefined) => void;
}

export type UseMenuPopupReturnValue = void;
