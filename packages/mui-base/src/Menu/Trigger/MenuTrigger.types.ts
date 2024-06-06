import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface MenuTriggerProps extends BaseUIComponentProps<'button', MenuTriggerOwnerState> {
  children?: React.ReactNode;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled?: boolean;
  /**
   * Label of the button
   */
  label?: string;
}

export type MenuTriggerOwnerState = {
  open: boolean;
};
