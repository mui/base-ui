import type { GenericHTMLProps } from '../../utils/types';

export interface UsePopoverTriggerParameters {
  getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export interface UsePopoverTriggerReturnValue {
  getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
