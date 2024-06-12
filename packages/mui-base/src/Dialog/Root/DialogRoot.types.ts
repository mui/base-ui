export type SoftCloseOptions = boolean | 'clickOutside' | 'escapeKey';

interface DialogRootParameters {
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
   * Determines whether the dialog should close when clicking outside of it or pressing the escape key.
   * @default false
   */
  softClose?: SoftCloseOptions;
}

export interface DialogRootProps extends DialogRootParameters {
  children?: React.ReactNode;
}

export interface UseDialogRootParameters extends DialogRootParameters {
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
   * Callback to notify the dialog that the backdrop is present.
   */
  setBackdropPresent: (present: boolean) => void;
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
}

export interface DialogRootContextValue extends UseDialogRootReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
}
