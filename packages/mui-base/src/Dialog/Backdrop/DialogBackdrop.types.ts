import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';
import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';
import { OpenState } from '../../Transitions';

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
  openState: OpenState;
  mounted: boolean;
}
