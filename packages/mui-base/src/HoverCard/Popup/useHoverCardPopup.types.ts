import type { GenericHTMLProps } from '../../utils/types';

export interface UseHoverCardPopupParameters {
  getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export interface UseHoverCardPopupReturnValue {
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
