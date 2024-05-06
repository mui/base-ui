import { DialogRootOwnerState } from '../Root/DialogRoot.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogDescriptionProps
  extends BaseUIComponentProps<'button', DialogDescriptionOwnerState> {}

export interface DialogDescriptionOwnerState extends DialogRootOwnerState {}

export interface UseDialogDescriptionParameters {
  id?: string;
}

export interface UseDialogDescriptionReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  type: 'dialog' | 'alertdialog';
  modal: boolean;
}
