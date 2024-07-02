import type { GenericHTMLProps } from '../../utils/types';

export interface UseTooltipPopupParameters {
  getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export interface UseTooltipPopupReturnValue {
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
