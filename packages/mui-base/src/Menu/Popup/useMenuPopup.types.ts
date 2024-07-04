import { FloatingEvents } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';

export interface UseMenuPopupParameters {
  menuEvents: FloatingEvents;
  setOpen: (open: boolean, event: Event | undefined) => void;
}

export interface UseMenuPopupReturnValue {
  /**
   * Resolver for the Popup's props.
   * @param externalProps additional props for the Popup component
   * @returns props that should be spread on the Popup component
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
