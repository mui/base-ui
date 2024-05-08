import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogTitleProps extends BaseUIComponentProps<'button', DialogTitleOwnerState> {}

export interface DialogTitleOwnerState extends DialogPopupOwnerState {}

export interface UseDialogTitleParameters {
  id?: string;
}

export interface UseDialogTitleReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  modal: boolean;
}
