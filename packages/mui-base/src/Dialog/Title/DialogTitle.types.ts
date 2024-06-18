import { BaseUIComponentProps } from '../../utils/types';

export interface DialogTitleProps extends BaseUIComponentProps<'h2', DialogTitleOwnerState> {}

export interface DialogTitleOwnerState {
  open: boolean;
  modal: boolean;
}
