import { BaseUIComponentProps } from '../../utils/types';

export interface AlertDialogTitleProps
  extends BaseUIComponentProps<'h2', AlertDialogTitleOwnerState> {}

export interface AlertDialogTitleOwnerState {
  open: boolean;
}
