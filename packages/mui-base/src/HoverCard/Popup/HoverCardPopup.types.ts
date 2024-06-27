import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type HoverCardPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
  entering: boolean;
  exiting: boolean;
};

export interface HoverCardPopupProps
  extends BaseUIComponentProps<'div', HoverCardPopupOwnerState> {}
