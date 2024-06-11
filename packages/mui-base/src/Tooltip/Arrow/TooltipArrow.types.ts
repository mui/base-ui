import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type TooltipArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
};

export interface TooltipArrowProps extends BaseUIComponentProps<'div', TooltipArrowOwnerState> {
  /**
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
