import type { BaseUIComponentProps } from '../utils/BaseUI.types';
import { UseSwitchParameters } from '../useSwitch';

export type OwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
};

export interface RootProps
  extends UseSwitchParameters,
    Omit<BaseUIComponentProps<'button', OwnerState>, 'onChange'> {}

export interface ThumbProps extends BaseUIComponentProps<'span', OwnerState> {}
