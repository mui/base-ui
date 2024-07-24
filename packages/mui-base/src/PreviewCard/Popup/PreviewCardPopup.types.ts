import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
  entering: boolean;
  exiting: boolean;
};

export interface PreviewCardPopupProps
  extends BaseUIComponentProps<'div', PreviewCardPopupOwnerState> {}
