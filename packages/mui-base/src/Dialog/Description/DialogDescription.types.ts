import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogDescriptionProps
  extends BaseUIComponentProps<'p', DialogDescriptionOwnerState> {}

export interface DialogDescriptionOwnerState {
  open: boolean;
  modal: boolean;
}
