import * as React from 'react';
import { type FloatingContext } from '@floating-ui/react';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface DialogPopupProps extends BaseUIComponentProps<'div', DialogPopupOwnerState> {
  keepMounted?: boolean;
}

export interface DialogPopupOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogPopupParameters {
  id?: string;
  keepMounted?: boolean;
  ref: React.Ref<HTMLElement>;
}

export interface UseDialogPopupReturnValue {
  open: boolean;
  modal: boolean;
  getRootProps: (
    otherProps: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  floatingUIContext: FloatingContext;
}
