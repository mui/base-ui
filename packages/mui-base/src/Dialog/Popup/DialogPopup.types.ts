import * as React from 'react';
import { type FloatingContext } from '@floating-ui/react';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';
import { TransitionStatus } from '../../Transitions';

export interface DialogPopupProps extends BaseUIComponentProps<'div', DialogPopupOwnerState> {
  keepMounted?: boolean;
  animated?: boolean;
}

export interface DialogPopupOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogPopupParameters {
  id?: string;
  keepMounted: boolean;
  ref: React.Ref<HTMLElement>;
  animated: boolean;
}

export interface UseDialogPopupReturnValue {
  open: boolean;
  modal: boolean;
  mounted: boolean;
  getRootProps: (
    otherProps: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  floatingUIContext: FloatingContext;
  transitionStatus: TransitionStatus | null;
}
