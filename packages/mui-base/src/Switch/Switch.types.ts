import { BaseUiComponentCommonProps } from '../utils/BaseUiComponentCommonProps';
import { UseSwitchParameters } from '../useSwitch';

export type SwitchOwnerState = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
};

export interface SwitchProps
  extends UseSwitchParameters,
    Omit<BaseUiComponentCommonProps<'button', SwitchOwnerState>, 'onChange'> {}

export interface SwitchThumbProps extends BaseUiComponentCommonProps<'span', SwitchOwnerState> {}
