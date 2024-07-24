import { BaseUIComponentProps } from '../../utils/types';

export interface AlertDialogDescriptionProps
  extends BaseUIComponentProps<'p', AlertDialogDescriptionOwnerState> {}

export interface AlertDialogDescriptionOwnerState {
  open: boolean;
}
