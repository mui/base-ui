export type DialogType = 'dialog' | 'alertdialog';

export type SoftCloseOptions = boolean | 'clickOutside' | 'escapeKey';

export interface DialogRootProps extends UseDialogRootParameters {
  children?: React.ReactNode;
}

export interface UseDialogRootParameters {
  /**
   * Determines whether the dialog is open.
   */
  open?: boolean;
  /**
   * Determines whether the dialog is initally open.
   * This is an uncontrolled equivalent of the `open` prop.
   */
  defaultOpen?: boolean;
  /**
   * Determines whether the dialog is modal.
   * @default true
   */
  modal?: boolean;
  /**
   * Callback invoked when the dialog is being opened or closed.
   * @param open The new open state.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The type of the dialog - either 'dialog' or 'alertdialog'.
   * @default 'dialog'
   */
  type?: DialogType;
  /**
   * Determines whether the dialog should close when clicking outside of it or pressing the escape key.
   * @default false
   */
  softClose?: SoftCloseOptions;
}

export interface UseDialogRootReturnValue {
  contextValue: DialogRootContextValue;
  /**
   * The open state of the dialog.
   */
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
