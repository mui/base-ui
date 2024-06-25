import type { GenericHTMLProps } from '../../utils/types';

export interface UsePopoverPopupParameters {
  getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  titleId: string | undefined;
  descriptionId: string | undefined;
}

export interface UsePopoverPopupReturnValue {
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
