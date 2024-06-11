import { BaseUIComponentProps } from '../../utils/types';

export interface DialogCloseProps extends BaseUIComponentProps<'button', DialogCloseOwnerState> {}

export interface DialogCloseOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogCloseParameters {
  /**
   * Determines whether the dialog is open.
   */
  open: boolean;
  /**
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange: (open: boolean) => void;
}

export interface UseDialogCloseReturnValue {
  /**
   * Resolver for the root element props.
   */
  getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
}
