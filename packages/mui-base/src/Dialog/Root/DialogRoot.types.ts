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

export interface UseDialogRootReturnValue extends DialogRootContextValue {}

export interface DialogRootContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal: boolean;
  type: DialogType;
  softClose: SoftCloseOptions;
  titleElementId: string | undefined;
  setTitleElementId: (elementId: string | undefined) => void;
  descriptionElementId: string | undefined;
  setDescriptionElementId: (elementId: string | undefined) => void;
  popupElementId: string | undefined;
  setPopupElementId: (elementId: string | undefined) => void;
}
