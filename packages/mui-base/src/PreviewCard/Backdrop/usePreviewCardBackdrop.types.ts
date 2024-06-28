import type { GenericHTMLProps } from '../../utils/types';

export interface UsePreviewCardBackdropParameters {}

export interface UsePreviewCardBackdropReturnValue {
  getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
