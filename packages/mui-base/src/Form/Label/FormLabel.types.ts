import type { BaseUIComponentProps } from '../../utils/types';

export interface FormLabelProps extends BaseUIComponentProps<'label' | 'span', {}> {
  /**
   * Whether to prevent text selection when double clicking the label.
   * @default true
   */
  preventTextSelection?: boolean;
}
