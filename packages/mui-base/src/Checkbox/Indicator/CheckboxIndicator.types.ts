import { BaseUIComponentProps } from '../../utils/BaseUI.types';
import { CheckboxOwnerState } from '../Root/CheckboxRoot.types';

export interface CheckboxIndicatorProps extends BaseUIComponentProps<'span', CheckboxOwnerState> {
  /**
   * If `true`, the indicator stays mounted when unchecked. Useful for CSS animations.
   * @default false
   */
  keepMounted?: boolean;
}
