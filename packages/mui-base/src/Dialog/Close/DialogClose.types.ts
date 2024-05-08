import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogCloseProps extends BaseUIComponentProps<'button', DialogCloseOwnerState> {}

export interface DialogCloseOwnerState extends DialogPopupOwnerState {}

export interface UseDialogCloseReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  modal: boolean;
}
