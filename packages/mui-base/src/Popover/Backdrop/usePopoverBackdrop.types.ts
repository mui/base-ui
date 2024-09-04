import type { GenericHTMLProps } from '../../utils/types';

export interface UsePopoverBackdropParameters {}

export interface UsePopoverBackdropReturnValue {
  getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
