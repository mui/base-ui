import { BaseUIComponentProps } from '../../utils/types';

export interface AlertDialogCloseProps
  extends BaseUIComponentProps<'button', AlertDialogCloseOwnerState> {}

export interface AlertDialogCloseOwnerState {
  open: boolean;
}
