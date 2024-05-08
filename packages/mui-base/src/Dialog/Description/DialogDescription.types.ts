import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogDescriptionProps
  extends BaseUIComponentProps<'button', DialogDescriptionOwnerState> {}

export interface DialogDescriptionOwnerState extends DialogPopupOwnerState {}

export interface UseDialogDescriptionParameters {
  id?: string;
}

export interface UseDialogDescriptionReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  modal: boolean;
}
