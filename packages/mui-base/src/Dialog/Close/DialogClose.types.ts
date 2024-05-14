import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogCloseProps extends BaseUIComponentProps<'button', DialogCloseOwnerState> {}

export interface DialogCloseOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogCloseParameters {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface UseDialogCloseReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
}
