import * as React from 'react';
import { DialogRootOwnerState } from '../Root/DialogRoot.types';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogPopupProps extends BaseUIComponentProps<'div', DialogPopupOwnerState> {
  keepMounted?: boolean;
}

export interface DialogPopupOwnerState extends DialogRootOwnerState {}

export interface UseDialogPopupParameters {
  id?: string;
  keepMounted?: boolean;
  ref: React.Ref<HTMLElement>;
}
