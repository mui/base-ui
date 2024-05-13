import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogDescriptionProps
  extends BaseUIComponentProps<'button', DialogDescriptionOwnerState> {}

export interface DialogDescriptionOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogDescriptionParameters {
  /**
   * The id of the description element.
   */
  id?: string;
}

export interface UseDialogDescriptionReturnValue {
  getRootProps: (otherProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  modal: boolean;
}
