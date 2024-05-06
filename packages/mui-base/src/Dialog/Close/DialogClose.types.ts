import { DialogRootOwnerState } from '../Root/DialogRoot.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogCloseProps extends BaseUIComponentProps<'button', DialogCloseOwnerState> {}

export interface DialogCloseOwnerState extends DialogRootOwnerState {}

export interface UseDialogCloseReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  type: 'dialog' | 'alertdialog';
  modal: boolean;
}
