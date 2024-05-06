import * as React from 'react';
import { type FloatingContext } from '@floating-ui/react';
import { DialogRootOwnerState, DialogType } from '../Root/DialogRoot.types';
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

export interface UseDialogPopupReturnValue {
  open: boolean;
  modal: boolean;
  type: DialogType;
  getRootProps: (
    otherProps: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  floatingUIContext: FloatingContext;
}
