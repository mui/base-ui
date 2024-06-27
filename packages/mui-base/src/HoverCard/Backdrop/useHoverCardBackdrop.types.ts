import type { GenericHTMLProps } from '../../utils/types';

export interface UseHoverCardBackdropParameters {}

export interface UseHoverCardBackdropReturnValue {
  getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
