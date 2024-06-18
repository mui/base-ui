import { BaseUIComponentProps } from '../../utils/types';

export interface AlertDialogTriggerProps
  extends BaseUIComponentProps<'button', AlertDialogTriggerOwnerState> {}

export interface AlertDialogTriggerOwnerState {
  open: boolean;
}
