import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

export type PopoverPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
  entering: boolean;
  exiting: boolean;
};

export interface PopoverPopupProps extends BaseUIComponentProps<'div', PopoverPopupOwnerState> {}
