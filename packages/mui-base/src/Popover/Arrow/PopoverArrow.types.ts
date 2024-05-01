import type { Side } from '@floating-ui/react';
import { BaseUIComponentProps } from '../../utils/types';

export type PopoverArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowUncentered: boolean;
};

export interface PopoverArrowProps extends BaseUIComponentProps<'div', PopoverArrowOwnerState> {
  /**
   * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
