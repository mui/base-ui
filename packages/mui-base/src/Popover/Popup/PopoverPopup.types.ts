import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type PopoverPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  entering: boolean;
  exiting: boolean;
};

export interface PopoverPopupProps extends BaseUIComponentProps<'div', PopoverPopupOwnerState> {}
