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
  /**
   * Callback to invoke when a nested dialog is opened.
   */
  onNestedDialogOpen?: (ownChildrenCount: number) => void;
  /**
   * Callback to invoke when a nested dialog is closed.
   */
  onNestedDialogClose?: () => void;
}

export interface UseDialogRootReturnValue {
  /**
   * The id of the description element associated with the dialog.
   */
  descriptionElementId: string | undefined;
  /**
   * Determines if the dialog is modal.
   */
  modal: boolean;
  /**
   * Number of nested dialogs that are currently open.
   */
  nestedOpenDialogCount: number;
  /**
   * Callback to invoke when a nested dialog is closed.
   */
  onNestedDialogClose?: () => void;
  /**
   * Callback to invoke when a nested dialog is opened.
   */
  onNestedDialogOpen?: (ownChildrenCount: number) => void;
  /**
   * Callback to fire when the dialog is requested to be opened or closed.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Determines if the dialog is open.
   */
  open: boolean;
  /**
   * The id of the popup element.
   */
  popupElementId: string | undefined;
  /**
   * Callback to set the id of the description element associated with the dialog.
   */
  setDescriptionElementId: (elementId: string | undefined) => void;
  /**
   * Callback to set the id of the popup element.
   */
  setPopupElementId: (elementId: string | undefined) => void;
  /**
   * Callback to set the id of the title element.
   */
  setTitleElementId: (elementId: string | undefined) => void;
  /**
   * Determines whether the dialog should close when clicking outside of it or pressing the escape key.
   */
  softClose: SoftCloseOptions;
  /**
   * The id of the title element associated with the dialog.
   */
  titleElementId: string | undefined;
  /**
   * Type of the dialog (ordinary dialog or alert dialog).
   */
  type: DialogType;
}

export interface DialogRootContextValue extends UseDialogRootReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
}
