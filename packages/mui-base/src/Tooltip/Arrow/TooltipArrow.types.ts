import type { FloatingArrowProps, FloatingContext, Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/BaseUI.types';

export type TooltipArrowOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
} & Pick<FloatingArrowProps, 'tipRadius' | 'staticOffset' | 'd'> & {
    floatingContext: FloatingContext;
  };

export interface TooltipArrowProps
  extends Omit<
      BaseUIComponentProps<'svg', TooltipArrowOwnerState>,
      'width' | 'height' | 'strokeWidth'
    >,
    Pick<
      FloatingArrowProps,
      // Sizes must be in pixels.
      'width' | 'height' | 'strokeWidth' | 'tipRadius' | 'd' | 'staticOffset'
    > {
  /**
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
