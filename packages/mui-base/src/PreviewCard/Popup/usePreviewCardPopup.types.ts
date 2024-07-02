import type { GenericHTMLProps } from '../../utils/types';

export interface UsePreviewCardPopupParameters {
  getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export interface UsePreviewCardPopupReturnValue {
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
