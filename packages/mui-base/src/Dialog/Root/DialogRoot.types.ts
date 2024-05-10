export type DialogType = 'dialog' | 'alertdialog';

export type SoftCloseOptions = boolean | 'clickOutside' | 'escapeKey';

export interface DialogRootProps extends UseDialogRootParameters {
  children?: React.ReactNode;
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
  contextValue: DialogRootContextValue;
  open: boolean;
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
