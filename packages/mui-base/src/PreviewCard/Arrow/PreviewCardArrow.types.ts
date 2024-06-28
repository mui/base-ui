import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';

export type PreviewCardArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
};

export interface PreviewCardArrowProps
  extends BaseUIComponentProps<'div', PreviewCardArrowOwnerState> {
  /**
   * Whether the `Arrow` is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
