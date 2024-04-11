import type { BaseUIComponentProps } from '../utils/BaseUI.types';
import { UseSwitchParameters } from '../useSwitch';

export type SwitchOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
};

export interface SwitchProps
  extends UseSwitchParameters,
    Omit<BaseUIComponentProps<'button', SwitchOwnerState>, 'onChange'> {}

export interface SwitchThumbProps extends BaseUIComponentProps<'span', SwitchOwnerState> {}
