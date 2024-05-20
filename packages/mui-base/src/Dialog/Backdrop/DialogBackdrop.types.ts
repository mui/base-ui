import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';
import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';

export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdropOwnerState> {
  animated?: boolean;
  keepMounted?: boolean;
}

export interface DialogBackdropOwnerState extends DialogPopupOwnerState {}

export interface UseDialogBackdropParams {
  animated: boolean;
  open: boolean;
}

export interface UseDialogBackdropReturnValue {
  getRootProps: (props?: Record<string, any>) => Record<string, any>;
  mounted: boolean;
}
