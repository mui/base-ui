import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';
import { DialogPopupOwnerState } from '../Popup/DialogPopup.types';

export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdropOwnerState> {
  animated?: boolean;
}

export interface DialogBackdropOwnerState extends DialogPopupOwnerState {}
