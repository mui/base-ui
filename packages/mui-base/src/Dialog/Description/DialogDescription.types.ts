import { BaseUIComponentProps } from '../../utils/types';

export interface DialogDescriptionProps
  extends BaseUIComponentProps<'p', DialogDescriptionOwnerState> {}

export interface DialogDescriptionOwnerState {
  open: boolean;
  modal: boolean;
}
