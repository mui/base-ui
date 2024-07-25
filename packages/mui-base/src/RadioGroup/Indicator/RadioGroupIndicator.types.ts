import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupIndicatorOwnerState = {
  disabled: boolean;
  checked: boolean;
};

export interface RadioGroupIndicatorProps
  extends BaseUIComponentProps<'span', RadioGroupIndicatorOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted?: boolean;
}
