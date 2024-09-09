import { CheckboxRootOwnerState } from '../Root/CheckboxRoot.types';
import { BaseUIComponentProps } from '../../utils/types';

export interface CheckboxIndicatorProps
  extends BaseUIComponentProps<'span', CheckboxRootOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted?: boolean;
}
