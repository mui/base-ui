import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogTitleProps extends BaseUIComponentProps<'h2', DialogTitleOwnerState> {}

export interface DialogTitleOwnerState {
  open: boolean;
  modal: boolean;
}
