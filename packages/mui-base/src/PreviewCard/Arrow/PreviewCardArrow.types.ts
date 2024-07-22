import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
};

export interface PreviewCardArrowProps
  extends BaseUIComponentProps<'div', PreviewCardArrowOwnerState> {
  /**
   * Whether the `Arrow` is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
