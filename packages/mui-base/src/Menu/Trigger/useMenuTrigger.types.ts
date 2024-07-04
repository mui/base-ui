import { FloatingEvents } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';

export interface UseMenuTriggerParameters {
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The ref to the root element.
   */
  rootRef?: React.Ref<HTMLElement>;
  setTriggerElement: (element: HTMLElement | null) => void;
  open: boolean;
  setOpen: (open: boolean, event: Event | undefined) => void;
  menuEvents: FloatingEvents;
}

export interface UseMenuTriggerReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps props for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref to the root element.
   */
  rootRef: React.RefCallback<Element> | null;
}
