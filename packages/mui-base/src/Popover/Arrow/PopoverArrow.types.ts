import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

export type PopoverArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
  arrowUncentered: boolean;
};

export interface PopoverArrowProps extends BaseUIComponentProps<'div', PopoverArrowOwnerState> {
  /**
   * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
