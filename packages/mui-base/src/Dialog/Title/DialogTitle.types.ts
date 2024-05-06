import { DialogRootOwnerState } from '../Root/DialogRoot.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogTitleProps extends BaseUIComponentProps<'button', DialogTitleOwnerState> {}

export interface DialogTitleOwnerState extends DialogRootOwnerState {}

export interface UseDialogTitleParameters {
  id?: string;
}

export interface UseDialogTitleReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  type: 'dialog' | 'alertdialog';
  modal: boolean;
}
