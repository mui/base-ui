import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type TooltipPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
  entering: boolean;
  exiting: boolean;
};

export interface TooltipPopupProps extends BaseUIComponentProps<'div', TooltipPopupOwnerState> {}
