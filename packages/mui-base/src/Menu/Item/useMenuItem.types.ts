import { FloatingEvents } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';

export interface UseMenuItemParameters {
  closeOnClick: boolean;
  disabled: boolean;
  highlighted: boolean;
  id: string | undefined;
  menuEvents: FloatingEvents;
  rootRef?: React.Ref<Element>;
  clickAndDragEnabled: boolean;
}

export interface UseMenuItemReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps event handlers for the root slot
   * @returns props that should be spread on the root slot
   */
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref to the component's root DOM element.
   */
  rootRef: React.RefCallback<Element> | null;
}
