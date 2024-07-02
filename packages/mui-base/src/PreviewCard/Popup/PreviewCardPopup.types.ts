import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
  entering: boolean;
  exiting: boolean;
};

export interface PreviewCardPopupProps
  extends BaseUIComponentProps<'div', PreviewCardPopupOwnerState> {}
