import * as React from 'react';
import { type BaseUIComponentProps } from '../../utils/BaseUI.types';

export type DialogType = 'dialog' | 'alertdialog';

export type SoftCloseOptions = boolean | 'clickOutside' | 'escapeKey';

export interface DialogRootProps
  extends BaseUIComponentProps<typeof React.Fragment, DialogRootOwnerState>,
    UseDialogRootParameters {}

export interface DialogRootOwnerState {
  open: boolean;
  modal: boolean;
  type: DialogType;
}

export interface UseDialogRootParameters {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  type?: DialogType;
  softClose?: SoftCloseOptions;
}

export interface UseDialogRootReturnValue {
  open: boolean;
  contextValue: DialogRootContextValue;
}

export interface DialogRootContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  modal: boolean;
  type: DialogType;
  softClose: SoftCloseOptions;
  titleElementId: string | null;
  setTitleElementId: (elementId: string | null) => void;
  descriptionElementId: string | null;
  setDescriptionElementId: (elementId: string | null) => void;
  popupElementId: string | null;
  setPopupElementId: (elementId: string | null) => void;
}
