import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';
import { DialogRootOwnerState } from '../Root/DialogRoot.types';

export interface DialogBackdropProps
  extends BaseUIComponentProps<'div', DialogBackdropOwnerState> {}

export interface DialogBackdropOwnerState extends DialogRootOwnerState {}
