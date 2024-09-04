import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

export type TooltipPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
  entering: boolean;
  exiting: boolean;
};

export interface TooltipPopupProps extends BaseUIComponentProps<'div', TooltipPopupOwnerState> {}
